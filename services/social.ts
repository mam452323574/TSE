import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import { Platform } from 'react-native';

import {
  SOCIAL_COMMENT_MAX_LENGTH,
  SOCIAL_FEED_PAGE_SIZE,
  SOCIAL_IMPRESSION_BATCH_SIZE,
  SOCIAL_POST_MAX_LENGTH,
  SOCIAL_STORAGE_BUCKET,
  normalizeSocialCategoryValue,
} from '@/constants/social';
import {
  getConfiguredSupabaseProjectLabel,
  invokeAuthedEdgeFunction,
} from './edgeFunctions';
import { supabase } from './supabase';
import { logOperationalError } from '@/utils/observability';
import {
  parseShareStoryPayload,
  resolveDefaultSocialCategoryForSharePayload as resolveDefaultSocialCategoryForSharePayloadFromShare,
} from '@/utils/shareStory';

import type {
  ShareStoryPayload,
  SocialCategory,
  SocialComment,
  SocialCreateCommentRequest,
  SocialCreateCommentResponse,
  SocialCreatePostRequest,
  SocialCreatePostResponse,
  SocialFeedPage,
  SocialPost,
  SocialReactionState,
  SocialRecordImpressionsRequest,
  SocialRecordImpressionsResponse,
  SocialReportContentRequest,
  SocialReportContentResponse,
  SocialReserveUploadResponse,
  SocialReportTargetType,
  SocialSetReactionRequest,
  SocialSetReactionResponse,
  UserProfile,
} from '@/types';

interface SupabaseErrorLike {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

export class SocialServiceError extends Error {
  code?: string;
  status?: number;
  details?: unknown;
  requestId?: string;
  functionName?: string;

  constructor(
    message: string,
    options: {
      code?: string;
      status?: number;
      details?: unknown;
      requestId?: string;
      functionName?: string;
    } = {},
  ) {
    super(message);
    this.name = 'SocialServiceError';
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
    this.requestId = options.requestId;
    this.functionName = options.functionName;
  }
}

const GENERIC_SOCIAL_PUBLISH_ERROR_CODES = new Set([
  'social_upload_lookup_failed',
  'reserved_upload_not_found',
  'invalid_upload_reference',
  'social_post_create_failed',
  'social_post_finalize_failed',
  'database_relation_missing',
  'database_column_missing',
  'database_rpc_missing',
  'database_policy_denied',
  'database_malformed_payload',
  'database_constraint_violation',
  'database_transient_failure',
  'internal_error',
]);

export const DEFAULT_SOCIAL_FEED_PAGE: SocialFeedPage = {
  items: [],
  next_cursor: null,
};

export function resolveSocialPublishErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  if (
    error instanceof SocialServiceError &&
    typeof error.code === 'string' &&
    GENERIC_SOCIAL_PUBLISH_ERROR_CODES.has(error.code)
  ) {
    return fallbackMessage;
  }

  if (error instanceof SocialServiceError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toSupabaseErrorLike(error: unknown): SupabaseErrorLike {
  if (!error || typeof error !== 'object') {
    return {};
  }

  return error as SupabaseErrorLike;
}

function buildSupabaseErrorHaystack(error: unknown) {
  const supabaseError = toSupabaseErrorLike(error);

  return [
    supabaseError.message,
    supabaseError.details,
    supabaseError.hint,
  ]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ')
    .toLowerCase();
}

function isMissingSocialRelationError(error: unknown) {
  const supabaseError = toSupabaseErrorLike(error);
  const errorCode = supabaseError.code ?? '';

  if (errorCode === '42P01' || errorCode === 'PGRST205') {
    return true;
  }

  const haystack = buildSupabaseErrorHaystack(error);

  return (
    (
      haystack.includes('social_posts') ||
      haystack.includes('social_comments') ||
      haystack.includes('relation')
    ) &&
    haystack.includes('does not exist')
  );
}

function isMissingSocialRpcError(error: unknown) {
  const supabaseError = toSupabaseErrorLike(error);
  const errorCode = supabaseError.code ?? '';
  const haystack = buildSupabaseErrorHaystack(error);

  return (
    errorCode === '42883' ||
    errorCode === 'PGRST202' ||
    haystack.includes('could not find function') ||
    haystack.includes('function') && haystack.includes('does not exist')
  );
}

function isMissingSupabaseColumnError(error: unknown) {
  const supabaseError = toSupabaseErrorLike(error);
  const errorCode = supabaseError.code ?? '';
  const haystack = buildSupabaseErrorHaystack(error);

  return (
    errorCode === '42703' ||
    errorCode === 'PGRST204' ||
    (haystack.includes('column') && haystack.includes('does not exist'))
  );
}

function isSupabasePolicyDeniedError(error: unknown) {
  const supabaseError = toSupabaseErrorLike(error);
  const errorCode = supabaseError.code ?? '';
  const haystack = buildSupabaseErrorHaystack(error);

  return (
    errorCode === '42501' ||
    haystack.includes('permission denied') ||
    haystack.includes('row-level security')
  );
}

function isSocialPostUnavailableError(error: unknown) {
  const supabaseError = toSupabaseErrorLike(error);
  return supabaseError.code === 'P0001' &&
    typeof supabaseError.message === 'string' &&
    supabaseError.message.toLowerCase().includes('social post not found');
}

function createSocialServiceError(
  message: string,
  options: {
    code?: string;
    status?: number;
    details?: unknown;
    requestId?: string;
    functionName?: string;
  } = {},
) {
  return new SocialServiceError(message, options);
}

function createSocialFeedQueryUnavailableError(error: unknown) {
  return createSocialServiceError(
    `Social feed query "get_social_feed_page" is unavailable on Supabase project "${getConfiguredSupabaseProjectLabel()}".`,
    {
      code: 'social_feed_query_unavailable',
      status: 503,
      details: error,
    },
  );
}

function createSocialCommentsQueryUnavailableError(error: unknown) {
  return createSocialServiceError(
    `Social comments query "get_social_comments_for_post" is unavailable on Supabase project "${getConfiguredSupabaseProjectLabel()}".`,
    {
      code: 'social_comments_query_unavailable',
      status: 503,
      details: error,
    },
  );
}

function createSocialFeedSchemaMismatchError(error: unknown) {
  return createSocialServiceError(
    `Social feed on Supabase project "${getConfiguredSupabaseProjectLabel()}" is missing required database schema for "get_social_feed_page".`,
    {
      code: 'social_feed_schema_mismatch',
      status: 503,
      details: error,
    },
  );
}

function createSocialCommentsSchemaMismatchError(error: unknown) {
  return createSocialServiceError(
    `Social comments on Supabase project "${getConfiguredSupabaseProjectLabel()}" are missing required database schema for "get_social_comments_for_post".`,
    {
      code: 'social_comments_schema_mismatch',
      status: 503,
      details: error,
    },
  );
}

function createSocialFeedPolicyDeniedError(error: unknown) {
  return createSocialServiceError(
    `Social feed access is denied by Supabase policies or grants on project "${getConfiguredSupabaseProjectLabel()}".`,
    {
      code: 'social_feed_policy_denied',
      status: 403,
      details: error,
    },
  );
}

function createSocialCommentsPolicyDeniedError(error: unknown) {
  return createSocialServiceError(
    `Social comments access is denied by Supabase policies or grants on project "${getConfiguredSupabaseProjectLabel()}".`,
    {
      code: 'social_comments_policy_denied',
      status: 403,
      details: error,
    },
  );
}

function createSocialReadError(
  fallbackMessage: string,
  fallbackCode: string,
  error: unknown,
) {
  const supabaseError = toSupabaseErrorLike(error);

  return createSocialServiceError(
    typeof supabaseError.message === 'string' && supabaseError.message.length > 0
      ? supabaseError.message
      : fallbackMessage,
    {
      code: supabaseError.code ?? fallbackCode,
      status: 500,
      details: error,
    },
  );
}

function createSocialFeedReadError(error: unknown) {
  if (isMissingSocialRpcError(error)) {
    return createSocialFeedQueryUnavailableError(error);
  }

  if (isMissingSocialRelationError(error) || isMissingSupabaseColumnError(error)) {
    return createSocialFeedSchemaMismatchError(error);
  }

  if (isSupabasePolicyDeniedError(error)) {
    return createSocialFeedPolicyDeniedError(error);
  }

  return createSocialReadError(
    'Failed to load social feed.',
    'social_feed_load_failed',
    error,
  );
}

function createSocialCommentsReadError(error: unknown) {
  if (isMissingSocialRpcError(error)) {
    return createSocialCommentsQueryUnavailableError(error);
  }

  if (isMissingSocialRelationError(error) || isMissingSupabaseColumnError(error)) {
    return createSocialCommentsSchemaMismatchError(error);
  }

  if (isSupabasePolicyDeniedError(error)) {
    return createSocialCommentsPolicyDeniedError(error);
  }

  return createSocialReadError(
    'Failed to load social comments.',
    'social_comments_load_failed',
    error,
  );
}

function readRequiredString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function readModerationStatus(value: unknown): SocialPost['moderation_status'] {
  return value === 'approved' ||
    value === 'rejected' ||
    value === 'flagged' ||
    value === 'hidden' ||
    value === 'removed' ||
    value === 'pending'
    ? value
    : 'pending';
}

function readReactionState(value: unknown): SocialReactionState {
  return value === 'like' || value === 'dislike' ? value : 'neutral';
}

function readSocialCategory(value: unknown): SocialCategory {
  return normalizeSocialCategoryValue(value);
}

function readSharePayloadSnapshot(value: unknown): ShareStoryPayload | null {
  return parseShareStoryPayload(value);
}

export function normalizeSocialTextInput(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function validateSocialPostInput(value?: string | null) {
  const normalizedValue = normalizeSocialTextInput(value ?? '');
  if (normalizedValue.length > SOCIAL_POST_MAX_LENGTH) {
    throw new SocialServiceError(
      `Post content must be ${SOCIAL_POST_MAX_LENGTH} characters or fewer`,
      {
        code: 'text_too_long',
        status: 400,
      },
    );
  }

  return normalizedValue;
}

export function validateSocialCommentInput(value: string) {
  const normalizedValue = normalizeSocialTextInput(value);
  if (!normalizedValue) {
    throw new SocialServiceError('Comment content is required', {
      code: 'invalid_payload',
      status: 400,
    });
  }

  if (normalizedValue.length > SOCIAL_COMMENT_MAX_LENGTH) {
    throw new SocialServiceError(
      `Comment content must be ${SOCIAL_COMMENT_MAX_LENGTH} characters or fewer`,
      {
        code: 'text_too_long',
        status: 400,
      },
    );
  }

  return normalizedValue;
}

function parseSocialPostRow(row: unknown): SocialPost | null {
  if (!isRecord(row)) {
    return null;
  }

  const id = readRequiredString(row.id);
  const authorId = readRequiredString(row.author_id);
  const createdAt = readRequiredString(row.created_at);

  if (!id || !authorId || !createdAt) {
    return null;
  }

  const moderationStatus = readModerationStatus(row.moderation_status ?? row.moderation_state);
  const viewerReaction = readReactionState(row.viewer_reaction);

  return {
    id,
    author_id: authorId,
    author_username: readOptionalString(row.author_username),
    author_avatar_url: readOptionalString(row.author_avatar_url),
    category: readSocialCategory(row.category),
    content_text: readOptionalString(row.content_text) ?? '',
    scan_id: readOptionalString(row.scan_id),
    share_payload_snapshot: readSharePayloadSnapshot(row.share_payload_snapshot),
    asset_path: readOptionalString(row.asset_path),
    asset_url: readOptionalString(row.asset_url),
    image_url: readOptionalString(row.image_url),
    created_at: createdAt,
    like_count: readNumber(row.like_count),
    dislike_count: readNumber(row.dislike_count),
    impression_count: readNumber(row.impression_count),
    comment_count: readNumber(row.comment_count),
    viewer_reaction: viewerReaction,
    viewer_has_liked: viewerReaction === 'like' || readBoolean(row.viewer_has_liked),
    moderation_status: moderationStatus,
    moderation_state: readModerationStatus(row.moderation_state ?? moderationStatus),
    moderation_reason: readOptionalString(row.moderation_reason),
    moderation_provider: readOptionalString(row.moderation_provider),
    rejection_count: readNumber(row.rejection_count),
    last_rejected_at: readOptionalString(row.last_rejected_at),
    deleted_at: readOptionalString(row.deleted_at),
  };
}

function parseSocialCommentRow(row: unknown): SocialComment | null {
  if (!isRecord(row)) {
    return null;
  }

  const id = readRequiredString(row.id);
  const postId = readRequiredString(row.post_id);
  const authorId = readRequiredString(row.author_id);
  const createdAt = readRequiredString(row.created_at);

  if (!id || !postId || !authorId || !createdAt) {
    return null;
  }

  const moderationStatus = readModerationStatus(row.moderation_status ?? row.moderation_state);

  return {
    id,
    post_id: postId,
    author_id: authorId,
    author_username: readOptionalString(row.author_username),
    author_avatar_url: readOptionalString(row.author_avatar_url),
    content_text: readOptionalString(row.content_text) ?? '',
    created_at: createdAt,
    moderation_status: moderationStatus,
    moderation_state: readModerationStatus(row.moderation_state ?? moderationStatus),
    moderation_reason: readOptionalString(row.moderation_reason),
    moderation_provider: readOptionalString(row.moderation_provider),
    rejection_count: readNumber(row.rejection_count),
    last_rejected_at: readOptionalString(row.last_rejected_at),
    deleted_at: readOptionalString(row.deleted_at),
  };
}

function parseCursor(cursor?: string | null) {
  if (!cursor) {
    return 0;
  }

  const numericCursor = Number.parseInt(cursor, 10);
  return Number.isFinite(numericCursor) && numericCursor >= 0 ? numericCursor : 0;
}

async function invokeAuthedSocialFunction<TResponse>(
  functionName: string,
  payload: Record<string, unknown>,
) {
  return invokeAuthedEdgeFunction<TResponse, SocialServiceError>({
    scopeLabel: 'Social',
    functionName,
    payload,
    createError: (message, options) =>
      createSocialServiceError(message, {
        code: options.code,
        status: options.status,
        details: options.details,
        requestId: options.requestId,
        functionName: options.functionName,
      }),
  });
}

function assertLocalSocialAssetUri(sourceUri: string) {
  const trimmedUri = sourceUri.trim();
  const lowerUri = trimmedUri.toLowerCase();

  if (
    lowerUri.startsWith('http://') ||
    lowerUri.startsWith('https://') ||
    lowerUri.startsWith('data:') ||
    lowerUri.includes('/storage/v1/object/sign/') ||
    lowerUri.includes('scan-images/')
  ) {
    throw new SocialServiceError(
      'Social assets must be generated from a stable local source, not a signed scan URL',
      {
        code: 'invalid_asset_source',
        status: 400,
      },
    );
  }

  return trimmedUri;
}

async function reserveSocialUpload(mimeType: string) {
  return invokeAuthedSocialFunction<SocialReserveUploadResponse>(
    'social-reserve-upload',
    {
      mime_type: mimeType,
    },
  );
}

export function buildStableSocialSharePayloadSnapshot(
  payload: ShareStoryPayload,
): ShareStoryPayload {
  return {
    ...payload,
    heroImageUri: null,
  };
}

export function resolveDefaultSocialCategoryForSharePayload(
  payload?: ShareStoryPayload | null,
): SocialCategory {
  return resolveDefaultSocialCategoryForSharePayloadFromShare(payload);
}

async function readSocialAssetArrayBuffer(uri: string) {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();

    if (typeof blob.arrayBuffer !== 'function') {
      throw new SocialServiceError('The image could not be prepared for upload.', {
        code: 'asset_prepare_failed',
        status: 400,
      });
    }

    return blob.arrayBuffer();
  }

  const fileInfo = await FileSystemLegacy.getInfoAsync(uri);

  if (!fileInfo.exists) {
    throw new SocialServiceError('The image could not be prepared for upload.', {
      code: 'asset_prepare_failed',
      status: 400,
    });
  }

  const base64Payload = await FileSystemLegacy.readAsStringAsync(uri, {
    encoding: FileSystemLegacy.EncodingType.Base64,
  });

  if (!base64Payload) {
    throw new SocialServiceError('The image could not be prepared for upload.', {
      code: 'asset_prepare_failed',
      status: 400,
    });
  }

  return decodeBase64(base64Payload);
}

export async function uploadSocialAssetFromUri(options: {
  sourceUri: string;
  userId: string;
}) {
  try {
    const normalizedUri = assertLocalSocialAssetUri(options.sourceUri);
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      normalizedUri,
      [],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    const arrayBuffer = await readSocialAssetArrayBuffer(manipulatedImage.uri);
    const reservation = await reserveSocialUpload('image/jpeg');
    const assetPath = reservation.asset_path;

    const { error: uploadError } = await supabase.storage
      .from(SOCIAL_STORAGE_BUCKET)
      .upload(assetPath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      throw new SocialServiceError(uploadError.message, {
        code: uploadError.name,
        status: 400,
        details: uploadError,
      });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(SOCIAL_STORAGE_BUCKET).getPublicUrl(assetPath);

    return {
      uploadId: reservation.upload_id,
      assetPath,
      assetUrl: publicUrl,
    };
  } catch (error) {
    if (error instanceof SocialServiceError) {
      throw error;
    }

    throw new SocialServiceError('The image could not be prepared for upload.', {
      code: 'asset_prepare_failed',
      status: 400,
      details: error,
    });
  }
}

export async function removeSocialAsset(assetPath: string) {
  if (!assetPath) {
    return;
  }

  await supabase.storage.from(SOCIAL_STORAGE_BUCKET).remove([assetPath]);
}

export async function fetchSocialFeed(
  category: SocialCategory | 'all' = 'all',
  cursor?: string | null,
  pageSize = SOCIAL_FEED_PAGE_SIZE,
): Promise<SocialFeedPage> {
  const offset = parseCursor(cursor);

  try {
    const { data, error } = await supabase.rpc('get_social_feed_page', {
      p_category: category === 'all' ? null : category,
      p_limit: pageSize,
      p_offset: offset,
    });

    if (error) {
      const socialError = createSocialFeedReadError(error);

      logOperationalError('[Social] Failed to fetch social feed', socialError, {
        category,
      });
      throw socialError;
    }

    const rawRows = Array.isArray(data) ? data : [];
    const items = rawRows
      .map(parseSocialPostRow)
      .filter((item): item is SocialPost => item !== null);

    return {
      items,
      next_cursor: rawRows.length >= pageSize ? String(offset + pageSize) : null,
    };
  } catch (error) {
    if (error instanceof SocialServiceError) {
      throw error;
    }

    logOperationalError('[Social] Unexpected social feed failure', error, {
      category,
    });
    throw createSocialReadError(
      'Failed to load social feed.',
      'social_feed_load_failed',
      error,
    );
  }
}

export async function fetchSocialComments(postId: string): Promise<SocialComment[]> {
  if (!postId) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('get_social_comments_for_post', {
      p_post_id: postId,
    });

    if (error) {
      if (isSocialPostUnavailableError(error)) {
        throw new SocialServiceError('Social post not found', {
          code: 'post_not_found',
          status: 404,
          details: error,
        });
      }

      const socialError = createSocialCommentsReadError(error);

      logOperationalError('[Social] Failed to fetch social comments', socialError, {
        post_id: postId,
      });
      throw socialError;
    }

    return (Array.isArray(data) ? data : [])
      .map(parseSocialCommentRow)
      .filter((item): item is SocialComment => item !== null);
  } catch (error) {
    if (error instanceof SocialServiceError) {
      throw error;
    }

    logOperationalError('[Social] Unexpected social comments failure', error, {
      post_id: postId,
    });
    throw createSocialReadError(
      'Failed to load social comments.',
      'social_comments_load_failed',
      error,
    );
  }
}

interface CreateSocialPostInput {
  viewerProfile: Pick<UserProfile, 'id' | 'username' | 'avatar_url'>;
  category: SocialCreatePostRequest['category'];
  contentText?: string | null;
  scanId?: string | null;
  sharePayload?: ShareStoryPayload | null;
  assetSourceUri?: string | null;
}

export async function createSocialPost(
  input: CreateSocialPostInput,
): Promise<SocialPost> {
  const normalizedContentText = validateSocialPostInput(input.contentText);
  const stableSharePayload = input.sharePayload
    ? buildStableSocialSharePayloadSnapshot(input.sharePayload)
    : null;

  let uploadedAssetPath: string | undefined;
  let uploadedUploadId: string | undefined;
  let uploadedAssetUrl: string | null = null;

  try {
    if (input.assetSourceUri) {
      const uploadResult = await uploadSocialAssetFromUri({
        sourceUri: input.assetSourceUri,
        userId: input.viewerProfile.id,
      });
      uploadedUploadId = uploadResult.uploadId;
      uploadedAssetPath = uploadResult.assetPath;
      uploadedAssetUrl = uploadResult.assetUrl;
    }

    const requestBody: SocialCreatePostRequest = {
      category: input.category,
      ...(normalizedContentText ? { content_text: normalizedContentText } : {}),
      ...(uploadedUploadId ? { upload_id: uploadedUploadId } : {}),
      ...(uploadedAssetPath ? { reserved_asset_path: uploadedAssetPath } : {}),
      ...(input.scanId ? { scan_id: input.scanId } : {}),
      ...(stableSharePayload ? { share_payload_snapshot: stableSharePayload } : {}),
    };

    const response = await invokeAuthedSocialFunction<SocialCreatePostResponse>(
      'social-create-post',
      requestBody as unknown as Record<string, unknown>,
    );

    return {
      id: response.post_id,
      author_id: input.viewerProfile.id,
      author_username: input.viewerProfile.username,
      author_avatar_url: input.viewerProfile.avatar_url,
      category: input.category,
      content_text: normalizedContentText,
      scan_id: input.scanId ?? null,
      share_payload_snapshot: stableSharePayload,
      asset_path: uploadedAssetPath ?? null,
      asset_url: response.asset_url ?? uploadedAssetUrl,
      image_url: response.asset_url ?? uploadedAssetUrl,
      created_at: new Date().toISOString(),
      like_count: 0,
      dislike_count: 0,
      impression_count: 0,
      comment_count: 0,
      viewer_reaction: 'neutral',
      viewer_has_liked: false,
      moderation_status: response.moderation_state,
      moderation_state: response.moderation_state,
      moderation_reason: null,
      moderation_provider: null,
      rejection_count: 0,
      last_rejected_at: null,
      deleted_at: null,
    };
  } catch (error) {
    if (uploadedAssetPath) {
      await removeSocialAsset(uploadedAssetPath);
    }
    throw error;
  }
}

interface CreateSocialCommentInput {
  viewerProfile: Pick<UserProfile, 'id' | 'username' | 'avatar_url'>;
  postId: string;
  contentText: string;
}

export async function createSocialComment(
  input: CreateSocialCommentInput,
): Promise<SocialComment> {
  const normalizedContentText = validateSocialCommentInput(input.contentText);
  const requestBody: SocialCreateCommentRequest = {
    post_id: input.postId,
    content_text: normalizedContentText,
  };

  const response = await invokeAuthedSocialFunction<SocialCreateCommentResponse>(
    'social-create-comment',
    requestBody as unknown as Record<string, unknown>,
  );

  return {
    id: response.comment_id,
    post_id: response.post_id,
    author_id: input.viewerProfile.id,
    author_username: input.viewerProfile.username,
    author_avatar_url: input.viewerProfile.avatar_url,
    content_text: normalizedContentText,
    created_at: new Date().toISOString(),
    moderation_status: response.moderation_state,
    moderation_state: response.moderation_state,
    moderation_reason: null,
    moderation_provider: null,
    rejection_count: 0,
    last_rejected_at: null,
    deleted_at: null,
  };
}

export async function setReactionOnSocialPost(
  postId: string,
  reaction: SocialReactionState,
) {
  const requestBody: SocialSetReactionRequest = {
    post_id: postId,
    reaction,
  };

  return invokeAuthedSocialFunction<SocialSetReactionResponse>(
    'social-set-reaction',
    requestBody as unknown as Record<string, unknown>,
  );
}

export async function recordSocialPostImpressions(
  postIds: string[],
  source: SocialRecordImpressionsRequest['source'] = 'feed',
) {
  const normalizedIds = normalizeSocialImpressionPostIds(postIds);

  if (normalizedIds.length === 0) {
    return {
      success: true,
      recorded_count: 0,
    } satisfies SocialRecordImpressionsResponse;
  }

  const requestBody: SocialRecordImpressionsRequest = {
    post_ids: normalizedIds,
    source,
  };

  return invokeAuthedSocialFunction<SocialRecordImpressionsResponse>(
    'social-record-impressions',
    requestBody as unknown as Record<string, unknown>,
  );
}

export async function reportSocialContent(
  requestBody: SocialReportContentRequest,
) {
  return invokeAuthedSocialFunction<SocialReportContentResponse>(
    'social-report-content',
    requestBody as unknown as Record<string, unknown>,
  );
}

export async function shareSocialPostAsset(
  assetUrl: string,
  postId: string,
  dialogTitle = 'Share social post',
) {
  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new SocialServiceError('Sharing is not available on this device', {
      code: 'sharing_unavailable',
      status: 400,
    });
  }

  const cacheDirectory = FileSystemLegacy.cacheDirectory;
  if (!cacheDirectory) {
    throw new SocialServiceError('Unable to access the device cache directory', {
      code: 'missing_cache_directory',
      status: 500,
    });
  }

  const downloadResult = await FileSystemLegacy.downloadAsync(
    assetUrl,
    `${cacheDirectory}social-post-${postId}.jpg`,
  );

  await Sharing.shareAsync(downloadResult.uri, {
    mimeType: 'image/jpeg',
    dialogTitle,
  });
}

export function createFeedPageWithMergedPost(
  page: SocialFeedPage,
  nextPost: SocialPost,
): SocialFeedPage {
  const items = [nextPost, ...page.items.filter((item) => item.id !== nextPost.id)];
  return {
    ...page,
    items,
  };
}

export function applyOptimisticReactionToSocialPost(
  post: SocialPost,
  nextReaction: SocialReactionState,
) {
  const previousReaction = post.viewer_reaction ?? (post.viewer_has_liked ? 'like' : 'neutral');
  let likeCount = post.like_count;
  let dislikeCount = post.dislike_count;

  if (previousReaction === 'like') {
    likeCount = Math.max(0, likeCount - 1);
  } else if (previousReaction === 'dislike') {
    dislikeCount = Math.max(0, dislikeCount - 1);
  }

  if (nextReaction === 'like') {
    likeCount += 1;
  } else if (nextReaction === 'dislike') {
    dislikeCount += 1;
  }

  return {
    ...post,
    viewer_reaction: nextReaction,
    viewer_has_liked: nextReaction === 'like',
    like_count: likeCount,
    dislike_count: dislikeCount,
  };
}

export function updateSocialPostLikeState(
  pages: SocialFeedPage[] | undefined,
  postId: string,
  updater: (post: SocialPost) => SocialPost,
) {
  if (!pages) {
    return pages;
  }

  return pages.map((page) => ({
    ...page,
    items: page.items.map((item) => (item.id === postId ? updater(item) : item)),
  }));
}

export function applyServerReactionStateToSocialPost(
  post: SocialPost,
  response: SocialSetReactionResponse,
) {
  const viewerReaction =
    response.viewer_reaction === 'like' ||
    response.viewer_reaction === 'dislike' ||
    response.viewer_reaction === 'neutral'
      ? response.viewer_reaction
      : 'neutral';

  return {
    ...post,
    viewer_reaction: viewerReaction,
    viewer_has_liked: viewerReaction === 'like',
    like_count: response.like_count,
    dislike_count: response.dislike_count,
  };
}

export function normalizeSocialImpressionPostIds(
  postIds: string[],
  maxBatchSize = SOCIAL_IMPRESSION_BATCH_SIZE,
) {
  return Array.from(
    new Set(
      postIds.filter(
        (postId): postId is string =>
          typeof postId === 'string' && postId.trim().length > 0,
      ),
    ),
  ).slice(0, maxBatchSize);
}

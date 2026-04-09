import { Phase2HttpError } from './phase2Errors.ts';
import type {
  Phase2RateLimitResult,
  Phase2RejectionCooldownResult,
  Phase2SocialRateLimitAction,
  Phase2UserProfileSnapshot,
} from './phase2Types.ts';
import {
  PHASE2_SOCIAL_BUCKET,
  isSocialAssetOwnedByUser,
  normalizeSocialImageMimeType,
} from './phase2Utils.ts';

interface SocialStorageObjectRow {
  bucket_id?: string | null;
  name?: string | null;
  metadata?: Record<string, unknown> | null;
}

function createSocialUploadLookupFailedError() {
  return new Phase2HttpError(
    503,
    'social_upload_lookup_failed',
    'The reserved social upload could not be resolved because storage lookup failed',
  );
}

function createReservedUploadNotFoundError() {
  return new Phase2HttpError(
    404,
    'reserved_upload_not_found',
    'The reserved social upload does not exist',
  );
}

function createInvalidUploadReferenceError() {
  return new Phase2HttpError(
    400,
    'invalid_upload_reference',
    'The provided social upload reference is invalid',
  );
}

function parseResolvedSocialUploadRow(
  userId: string,
  row: SocialStorageObjectRow,
  options: {
    uploadPrefix: string;
    expectedAssetPath?: string;
  },
) {
  const assetPath = typeof row.name === 'string' ? row.name : null;

  if (
    !assetPath ||
    !isSocialAssetOwnedByUser(userId, assetPath) ||
    !assetPath.startsWith(options.uploadPrefix) ||
    (options.expectedAssetPath && assetPath !== options.expectedAssetPath)
  ) {
    throw createInvalidUploadReferenceError();
  }

  const metadata = row.metadata as Record<string, unknown> | null;
  const rawMetadataMimeType =
    typeof metadata?.mimetype === 'string'
      ? metadata.mimetype
      : typeof metadata?.contentType === 'string'
        ? metadata.contentType
        : null;

  let metadataMimeType: string | null = null;
  if (rawMetadataMimeType) {
    try {
      metadataMimeType = normalizeSocialImageMimeType(rawMetadataMimeType);
    } catch {
      throw createInvalidUploadReferenceError();
    }
  }

  return {
    asset_path: assetPath,
    mime_type: metadataMimeType,
  };
}

async function resolveReservedSocialUploadByExactPath(
  client: any,
  userId: string,
  uploadPrefix: string,
  reservedAssetPath: string,
) {
  const { data, error } = await client
    .schema('storage')
    .from('objects')
    .select('bucket_id, name, metadata')
    .eq('bucket_id', PHASE2_SOCIAL_BUCKET)
    .eq('name', reservedAssetPath)
    .maybeSingle();

  if (error) {
    throw createSocialUploadLookupFailedError();
  }

  if (!data) {
    throw createReservedUploadNotFoundError();
  }

  return parseResolvedSocialUploadRow(userId, data as SocialStorageObjectRow, {
    uploadPrefix,
    expectedAssetPath: reservedAssetPath,
  });
}

async function resolveReservedSocialUploadByPrefix(
  client: any,
  userId: string,
  uploadPrefix: string,
) {
  const { data, error } = await client
    .schema('storage')
    .from('objects')
    .select('bucket_id, name, metadata')
    .eq('bucket_id', PHASE2_SOCIAL_BUCKET)
    .like('name', `${uploadPrefix}%`)
    .limit(2);

  if (error) {
    throw createSocialUploadLookupFailedError();
  }

  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) {
    throw createReservedUploadNotFoundError();
  }

  if (rows.length !== 1) {
    throw createInvalidUploadReferenceError();
  }

  return parseResolvedSocialUploadRow(userId, rows[0] as SocialStorageObjectRow, {
    uploadPrefix,
  });
}

export async function fetchViewerProfileSnapshot(
  client: any,
  userId: string,
): Promise<Phase2UserProfileSnapshot> {
  const { data, error } = await client
    .from('user_profiles')
    .select('username, avatar_url, account_tier')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return {
      username: null,
      avatar_url: null,
      account_tier: null,
    };
  }

  return {
    username: typeof data.username === 'string' ? data.username : null,
    avatar_url: typeof data.avatar_url === 'string' ? data.avatar_url : null,
    account_tier:
      typeof data.account_tier === 'string' ? data.account_tier : null,
  };
}

export async function isAdminUser(client: any, userId: string) {
  const { data } = await client
    .from('user_profiles')
    .select('account_tier')
    .eq('id', userId)
    .maybeSingle();

  return data?.account_tier === 'admin';
}

export async function assertOwnedScan(
  client: any,
  userId: string,
  scanId: string,
) {
  const { data, error } = await client
    .from('scans')
    .select('id')
    .eq('id', scanId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    throw new Phase2HttpError(403, 'scan_not_owned', 'The provided scan does not belong to the user');
  }
}

export async function assertOwnedSocialAsset(
  client: any,
  userId: string,
  assetPath: string,
) {
  if (!isSocialAssetOwnedByUser(userId, assetPath)) {
    throw new Phase2HttpError(
      403,
      'asset_not_owned',
      'Asset path must point to the authenticated user folder',
    );
  }

  const { data, error } = await client
    .schema('storage')
    .from('objects')
    .select('name')
    .eq('bucket_id', PHASE2_SOCIAL_BUCKET)
    .eq('name', assetPath)
    .maybeSingle();

  if (error || !data) {
    throw new Phase2HttpError(400, 'asset_not_found', 'The provided social asset does not exist');
  }
}

export async function resolveReservedSocialUpload(
  client: any,
  options: {
    userId: string;
    uploadId: string;
    reservedAssetPath?: string;
  },
) {
  const uploadPrefix = `${options.userId}/posts/${options.uploadId}.`;

  if (options.reservedAssetPath) {
    if (
      !isSocialAssetOwnedByUser(options.userId, options.reservedAssetPath) ||
      !options.reservedAssetPath.startsWith(uploadPrefix)
    ) {
      throw createInvalidUploadReferenceError();
    }

    return resolveReservedSocialUploadByExactPath(
      client,
      options.userId,
      uploadPrefix,
      options.reservedAssetPath,
    );
  }

  return resolveReservedSocialUploadByPrefix(client, options.userId, uploadPrefix);
}

export async function getSocialRateLimit(
  client: any,
  action: Phase2SocialRateLimitAction,
  userId: string,
): Promise<Phase2RateLimitResult> {
  const { data, error } = await client.rpc('check_social_rate_limit', {
    p_action: action,
    p_user_id: userId,
  });

  if (error) {
    throw new Phase2HttpError(
      500,
      'social_rate_limit_failed',
      'Failed to evaluate social rate limits',
      { action },
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Phase2HttpError(
      500,
      'social_rate_limit_failed',
      'Missing social rate limit result',
      { action },
    );
  }

  return {
    allowed: row.allowed === true,
    limit_count: Number(row.limit_count ?? 0),
    window_seconds: Number(row.window_seconds ?? 0),
    recent_count: Number(row.recent_count ?? 0),
    retry_after_seconds: Number(row.retry_after_seconds ?? 0),
  };
}

export async function getSocialRejectionCooldown(
  client: any,
  userId: string,
): Promise<Phase2RejectionCooldownResult> {
  const { data, error } = await client.rpc('get_social_rejection_cooldown', {
    p_user_id: userId,
  });

  if (error) {
    throw new Phase2HttpError(
      500,
      'social_rejection_cooldown_failed',
      'Failed to evaluate social rejection cooldown',
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return {
      active: false,
      cooldown_until: null,
      recent_rejection_count: 0,
      rejection_threshold: 0,
      cooldown_hours: 0,
    };
  }

  return {
    active: row.active === true,
    cooldown_until:
      typeof row.cooldown_until === 'string' ? row.cooldown_until : null,
    recent_rejection_count: Number(row.recent_rejection_count ?? 0),
    rejection_threshold: Number(row.rejection_threshold ?? 0),
    cooldown_hours: Number(row.cooldown_hours ?? 0),
  };
}

export async function getVisibleSocialPost(client: any, userId: string, postId: string) {
  const viewerIsAdmin = await isAdminUser(client, userId);
  const { data, error } = await client
    .from('social_posts')
    .select(
      'id, author_id, author_username, category, content_text, asset_url, moderation_state, deleted_at, like_count, dislike_count, impression_count, comment_count, created_at',
    )
    .eq('id', postId)
    .maybeSingle();

  if (error || !data) {
    throw new Phase2HttpError(404, 'post_not_found', 'Social post not found');
  }

  const isVisibleToUser =
    viewerIsAdmin ||
    data.author_id === userId ||
    (data.deleted_at === null && data.moderation_state === 'approved');

  if (!isVisibleToUser) {
    throw new Phase2HttpError(404, 'post_not_found', 'Social post not found');
  }

  return data;
}

export async function assertCommentableSocialPost(
  client: any,
  postId: string,
) {
  const { data, error } = await client
    .from('social_posts')
    .select('id, moderation_state, deleted_at')
    .eq('id', postId)
    .maybeSingle();

  if (error || !data || data.deleted_at !== null || data.moderation_state !== 'approved') {
    throw new Phase2HttpError(
      403,
      'post_not_commentable',
      'Comments are only allowed on approved posts',
    );
  }

  return data;
}

export async function getReportableTarget(
  client: any,
  userId: string,
  targetType: 'post' | 'comment',
  targetId: string,
) {
  if (targetType === 'post') {
    return getVisibleSocialPost(client, userId, targetId);
  }

  const { data, error } = await client
    .from('social_comments')
    .select('id, author_id, moderation_state, deleted_at, post_id, content_text, author_username, created_at')
    .eq('id', targetId)
    .maybeSingle();

  if (error || !data) {
    throw new Phase2HttpError(404, 'comment_not_found', 'Social comment not found');
  }

  await getVisibleSocialPost(client, userId, data.post_id);

  const viewerIsAdmin = await isAdminUser(client, userId);
  const isVisibleToUser =
    viewerIsAdmin ||
    data.author_id === userId ||
    (data.deleted_at === null && data.moderation_state === 'approved');

  if (!isVisibleToUser) {
    throw new Phase2HttpError(404, 'comment_not_found', 'Social comment not found');
  }

  return data;
}

export async function assertNoRecentDuplicatePost(
  client: any,
  userId: string,
  options: {
    contentHash?: string | null;
    assetHash?: string | null;
  },
) {
  const duplicateChecks = [];

  if (options.contentHash) {
    duplicateChecks.push(
      client
        .from('social_posts')
        .select('id')
        .eq('author_id', userId)
        .eq('content_hash', options.contentHash)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1)
        .maybeSingle(),
    );
  }

  if (options.assetHash) {
    duplicateChecks.push(
      client
        .from('social_posts')
        .select('id')
        .eq('author_id', userId)
        .eq('asset_hash', options.assetHash)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1)
        .maybeSingle(),
    );
  }

  if (duplicateChecks.length === 0) {
    return;
  }

  const results = await Promise.all(duplicateChecks);
  if (results.some((result) => !!result.data?.id)) {
    throw new Phase2HttpError(
      409,
      'duplicate_content',
      'Similar content was already submitted recently',
    );
  }
}

export async function assertNoRecentDuplicateComment(
  client: any,
  userId: string,
  contentHash: string,
) {
  const { data } = await client
    .from('social_comments')
    .select('id')
    .eq('author_id', userId)
    .eq('content_hash', contentHash)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    throw new Phase2HttpError(
      409,
      'duplicate_content',
      'A similar comment was already submitted recently',
    );
  }
}

export async function getRecentReportCount24h(
  client: any,
  targetType: 'post' | 'comment',
  targetId: string,
) {
  const query = client
    .from('social_reports')
    .select('reporter_id', { count: 'exact', head: false })
    .eq('target_type', targetType)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const scopedQuery =
    targetType === 'post'
      ? query.eq('target_post_id', targetId)
      : query.eq('target_comment_id', targetId);

  const { data, error } = await scopedQuery;
  if (error) {
    return 0;
  }

  return new Set(
    (Array.isArray(data) ? data : [])
      .map((item) => item.reporter_id)
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
  ).size;
}

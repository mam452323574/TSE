import { isCoachPersonaKey } from '../../../shared/coachPersonas.ts';
import { Phase2HttpError } from './phase2Errors.ts';
import type {
  CoachGenerateRequest,
  SocialCreateCommentRequest,
  SocialCreatePostRequest,
  SocialModerateContentRequest,
  SocialRecordImpressionsRequest,
  SocialReportContentRequest,
  SocialSetReactionRequest,
  SocialToggleLikeRequest,
} from './phase2Types.ts';
import {
  assertNoUnknownKeys,
  assertNormalizedTextLength,
  assertUuidLike,
  isRecord,
  normalizeOptionalFreeText,
  normalizeSocialImageMimeType,
  readOptionalBoolean,
  readOptionalNumber,
  readOptionalString,
  PHASE2_SOCIAL_COMMENT_MAX_LENGTH,
  PHASE2_SOCIAL_IMPRESSION_BATCH_MAX,
  PHASE2_SOCIAL_MODERATION_NOTE_MAX_LENGTH,
  PHASE2_SOCIAL_POST_MAX_LENGTH,
  PHASE2_SOCIAL_REPORT_DETAILS_MAX_LENGTH,
  validateStableSocialAssetPath,
  validateSocialImpressionSource,
  validatePhase2SocialCategory,
} from './phase2Utils.ts';

const ALLOWED_REPORT_REASON_CODES = new Set([
  'harassment',
  'hate_speech',
  'sexual_content',
  'graphic_gore',
  'spam_repeat',
  'self_harm',
  'illegal_activity',
  'misinformation',
  'other',
]);

const ALLOWED_REACTION_STATES = new Set(['like', 'dislike', 'neutral']);
const ALLOWED_MODERATION_ACTIONS = new Set([
  'approve',
  'flag',
  'hide',
  'remove',
  'restore',
  'reject',
  'dismiss_reports',
]);

function readRequiredTrimmedString(value: unknown, fieldName: string) {
  const parsedValue = readOptionalString(value);
  if (!parsedValue) {
    throw new Phase2HttpError(400, 'invalid_payload', `${fieldName} is required`);
  }
  return parsedValue;
}

function normalizeReservedAssetPath(value: unknown) {
  const rawAssetPath = readOptionalString(value);
  if (!rawAssetPath) {
    return undefined;
  }

  try {
    return validateStableSocialAssetPath(rawAssetPath);
  } catch (error) {
    if (error instanceof Phase2HttpError) {
      throw new Phase2HttpError(
        400,
        'invalid_upload_reference',
        'The provided social upload reference is invalid',
      );
    }

    throw error;
  }
}

const SOCIAL_CREATE_POST_ALLOWED_KEYS = [
  'category',
  'content_text',
  'upload_id',
  'reserved_asset_path',
  'scan_id',
  'share_payload_snapshot',
] as const;

const SOCIAL_CREATE_COMMENT_ALLOWED_KEYS = [
  'post_id',
  'content_text',
] as const;

const SOCIAL_TOGGLE_LIKE_ALLOWED_KEYS = ['post_id'] as const;

const SOCIAL_SET_REACTION_ALLOWED_KEYS = ['post_id', 'reaction'] as const;

const SOCIAL_REPORT_ALLOWED_KEYS = [
  'target_type',
  'target_post_id',
  'target_comment_id',
  'reason_code',
  'details',
] as const;

const SOCIAL_RECORD_IMPRESSIONS_ALLOWED_KEYS = ['post_ids', 'source'] as const;

const SOCIAL_MODERATE_CONTENT_ALLOWED_KEYS = [
  'target_type',
  'target_post_id',
  'target_comment_id',
  'action',
  'reason_code',
  'note',
  'report_ids',
] as const;

const COACH_GENERATE_ALLOWED_KEYS = [
  'payload',
  'persona_key',
  'locale',
  'force_refresh',
] as const;

const SHARE_PAYLOAD_ALLOWED_KEYS = [
  'variant',
  'variantLabel',
  'score',
  'scoreLabel',
  'heroImageUri',
  'metrics',
  'accentColor',
  'accentColorSecondary',
  'headline',
  'footerBrand',
  'footerCta',
  'statusBadgeLabel',
  'statusTone',
] as const;

const SHARE_PAYLOAD_METRIC_ALLOWED_KEYS = [
  'label',
  'value',
  'valueVariant',
  'labelMaxLines',
  'valueMaxLines',
] as const;

function normalizeSharePayloadSnapshot(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new Phase2HttpError(
      400,
      'invalid_share_payload',
      'share_payload_snapshot must be an object',
    );
  }

  assertNoUnknownKeys(value, SHARE_PAYLOAD_ALLOWED_KEYS, 'share_payload_snapshot');

  const variant = readOptionalString(value.variant);
  const score = readOptionalNumber(value.score);
  if (!variant || score === null) {
    throw new Phase2HttpError(
      400,
      'invalid_share_payload',
      'share_payload_snapshot must contain at least variant and score',
    );
  }

  const metrics = Array.isArray(value.metrics)
    ? value.metrics.map((metric, index) => {
        if (!isRecord(metric)) {
          throw new Phase2HttpError(
            400,
            'invalid_share_payload',
            `share_payload_snapshot.metrics[${index}] must be an object`,
          );
        }

        assertNoUnknownKeys(
          metric,
          SHARE_PAYLOAD_METRIC_ALLOWED_KEYS,
          `share_payload_snapshot.metrics[${index}]`,
        );

        const label = readRequiredTrimmedString(
          metric.label,
          `share_payload_snapshot.metrics[${index}].label`,
        );
        const metricValue = readRequiredTrimmedString(
          metric.value,
          `share_payload_snapshot.metrics[${index}].value`,
        );
        const valueVariant = readRequiredTrimmedString(
          metric.valueVariant,
          `share_payload_snapshot.metrics[${index}].valueVariant`,
        );

        if (
          valueVariant !== 'numeric' &&
          valueVariant !== 'fraction' &&
          valueVariant !== 'text'
        ) {
          throw new Phase2HttpError(
            400,
            'invalid_share_payload',
            `share_payload_snapshot.metrics[${index}].valueVariant is not supported`,
          );
        }

        return {
          label,
          value: metricValue,
          valueVariant,
          labelMaxLines: readOptionalNumber(metric.labelMaxLines) ?? 1,
          valueMaxLines: readOptionalNumber(metric.valueMaxLines) ?? 1,
        };
      })
    : [];

  return {
    variant,
    variantLabel: readOptionalString(value.variantLabel) ?? variant,
    score,
    scoreLabel: readOptionalString(value.scoreLabel) ?? String(score),
    heroImageUri: null,
    metrics,
    accentColor: readOptionalString(value.accentColor) ?? '#000000',
    accentColorSecondary: readOptionalString(value.accentColorSecondary) ?? undefined,
    headline: readOptionalString(value.headline) ?? undefined,
    footerBrand: readOptionalString(value.footerBrand) ?? 'HEALTH SCAN',
    footerCta: readOptionalString(value.footerCta) ?? 'Track your progress',
    statusBadgeLabel: readOptionalString(value.statusBadgeLabel) ?? undefined,
    statusTone:
      value.statusTone === 'neutral' || value.statusTone === 'warning'
        ? value.statusTone
        : undefined,
  };
}

export function parseSocialCreatePostRequest(payload: unknown): SocialCreatePostRequest {
  if (!isRecord(payload)) {
    throw new Phase2HttpError(400, 'invalid_payload', 'Request body must be an object');
  }

  assertNoUnknownKeys(payload, SOCIAL_CREATE_POST_ALLOWED_KEYS);

  const normalizedContentText = normalizeOptionalFreeText(payload.content_text, {
    fieldName: 'content_text',
    maxLength: PHASE2_SOCIAL_POST_MAX_LENGTH,
  });
  const uploadId = readOptionalString(payload.upload_id) ?? undefined;
  const reservedAssetPath = normalizeReservedAssetPath(payload.reserved_asset_path);
  const scanId = readOptionalString(payload.scan_id) ?? undefined;
  const sharePayloadSnapshot = normalizeSharePayloadSnapshot(payload.share_payload_snapshot);
  const category = validatePhase2SocialCategory(
    readRequiredTrimmedString(payload.category, 'category'),
  );

  if (uploadId) {
    assertUuidLike(uploadId, 'upload_id');
  }

  if (scanId) {
    assertUuidLike(scanId, 'scan_id');
  }

  if (reservedAssetPath && !uploadId) {
    throw new Phase2HttpError(
      400,
      'invalid_upload_reference',
      'reserved_asset_path requires upload_id',
    );
  }

  if (!normalizedContentText && !uploadId && !sharePayloadSnapshot) {
    throw new Phase2HttpError(
      400,
      'invalid_payload',
      'A post must include text, a stable asset, or a share payload snapshot',
    );
  }

  return {
    category,
    content_text: normalizedContentText ?? undefined,
    upload_id: uploadId,
    reserved_asset_path: reservedAssetPath,
    scan_id: scanId,
    share_payload_snapshot: sharePayloadSnapshot,
  };
}

export function parseSocialCreateCommentRequest(payload: unknown): SocialCreateCommentRequest {
  if (!isRecord(payload)) {
    throw new Phase2HttpError(400, 'invalid_payload', 'Request body must be an object');
  }

  assertNoUnknownKeys(payload, SOCIAL_CREATE_COMMENT_ALLOWED_KEYS);

  const postId = readRequiredTrimmedString(payload.post_id, 'post_id');
  assertUuidLike(postId, 'post_id');

  return {
    post_id: postId,
    content_text:
      normalizeOptionalFreeText(payload.content_text, {
        fieldName: 'content_text',
        maxLength: PHASE2_SOCIAL_COMMENT_MAX_LENGTH,
        required: true,
      }) ?? '',
  };
}

export function parseSocialToggleLikeRequest(payload: unknown): SocialToggleLikeRequest {
  if (!isRecord(payload)) {
    throw new Phase2HttpError(400, 'invalid_payload', 'Request body must be an object');
  }

  assertNoUnknownKeys(payload, SOCIAL_TOGGLE_LIKE_ALLOWED_KEYS);

  const postId = readRequiredTrimmedString(payload.post_id, 'post_id');
  assertUuidLike(postId, 'post_id');

  return {
    post_id: postId,
  };
}

export function parseSocialSetReactionRequest(
  payload: unknown,
): SocialSetReactionRequest {
  if (!isRecord(payload)) {
    throw new Phase2HttpError(400, 'invalid_payload', 'Request body must be an object');
  }

  assertNoUnknownKeys(payload, SOCIAL_SET_REACTION_ALLOWED_KEYS);

  const postId = readRequiredTrimmedString(payload.post_id, 'post_id');
  const reaction = readRequiredTrimmedString(payload.reaction, 'reaction');

  assertUuidLike(postId, 'post_id');

  if (!ALLOWED_REACTION_STATES.has(reaction)) {
    throw new Phase2HttpError(
      400,
      'invalid_reaction',
      'reaction must be like, dislike, or neutral',
    );
  }

  return {
    post_id: postId,
    reaction: reaction as SocialSetReactionRequest['reaction'],
  };
}

export function parseSocialReportContentRequest(
  payload: unknown,
): SocialReportContentRequest {
  if (!isRecord(payload)) {
    throw new Phase2HttpError(400, 'invalid_payload', 'Request body must be an object');
  }

  assertNoUnknownKeys(payload, SOCIAL_REPORT_ALLOWED_KEYS);

  const targetType = readRequiredTrimmedString(payload.target_type, 'target_type');
  if (targetType !== 'post' && targetType !== 'comment') {
    throw new Phase2HttpError(
      400,
      'invalid_target_type',
      'target_type must be either post or comment',
    );
  }

  const targetPostId = readOptionalString(payload.target_post_id) ?? undefined;
  const targetCommentId = readOptionalString(payload.target_comment_id) ?? undefined;

  if (targetType === 'post') {
    assertUuidLike(targetPostId ?? null, 'target_post_id');
  } else {
    assertUuidLike(targetCommentId ?? null, 'target_comment_id');
  }

  return {
    target_type: targetType,
    target_post_id: targetType === 'post' ? targetPostId : undefined,
    target_comment_id: targetType === 'comment' ? targetCommentId : undefined,
    reason_code: (() => {
      const reasonCode = readRequiredTrimmedString(payload.reason_code, 'reason_code');
      if (!ALLOWED_REPORT_REASON_CODES.has(reasonCode)) {
        throw new Phase2HttpError(
          400,
          'invalid_reason_code',
          'reason_code is not supported',
        );
      }
      return reasonCode as SocialReportContentRequest['reason_code'];
    })(),
    details: (() => {
      const details = normalizeOptionalFreeText(payload.details, {
        fieldName: 'details',
        maxLength: PHASE2_SOCIAL_REPORT_DETAILS_MAX_LENGTH,
      });

      if (payload.reason_code === 'other' && !details) {
        throw new Phase2HttpError(
          400,
          'missing_report_details',
          'details are required when reason_code is other',
        );
      }

      return details;
    })(),
  };
}

export function parseSocialRecordImpressionsRequest(
  payload: unknown,
): SocialRecordImpressionsRequest {
  if (!isRecord(payload)) {
    throw new Phase2HttpError(400, 'invalid_payload', 'Request body must be an object');
  }

  assertNoUnknownKeys(payload, SOCIAL_RECORD_IMPRESSIONS_ALLOWED_KEYS);

  if (!Array.isArray(payload.post_ids) || payload.post_ids.length === 0) {
    throw new Phase2HttpError(
      400,
      'invalid_post_ids',
      'post_ids must be a non-empty array',
    );
  }

  if (payload.post_ids.length > PHASE2_SOCIAL_IMPRESSION_BATCH_MAX) {
    throw new Phase2HttpError(
      400,
      'too_many_post_ids',
      `post_ids must contain at most ${PHASE2_SOCIAL_IMPRESSION_BATCH_MAX} items`,
    );
  }

  const postIds = payload.post_ids.map((postId, index) => {
    const normalizedPostId = readRequiredTrimmedString(postId, `post_ids[${index}]`);
    assertUuidLike(normalizedPostId, `post_ids[${index}]`);
    return normalizedPostId;
  });

  return {
    post_ids: Array.from(new Set(postIds)),
    source: validateSocialImpressionSource(payload.source),
  };
}

export function parseSocialModerateContentRequest(
  payload: unknown,
): SocialModerateContentRequest {
  if (!isRecord(payload)) {
    throw new Phase2HttpError(400, 'invalid_payload', 'Request body must be an object');
  }

  assertNoUnknownKeys(payload, SOCIAL_MODERATE_CONTENT_ALLOWED_KEYS);

  const targetType = readRequiredTrimmedString(payload.target_type, 'target_type');
  if (targetType !== 'post' && targetType !== 'comment') {
    throw new Phase2HttpError(
      400,
      'invalid_target_type',
      'target_type must be either post or comment',
    );
  }

  const action = readRequiredTrimmedString(payload.action, 'action');
  if (!ALLOWED_MODERATION_ACTIONS.has(action)) {
    throw new Phase2HttpError(
      400,
      'invalid_moderation_action',
      'action is not supported',
    );
  }

  const targetPostId = readOptionalString(payload.target_post_id) ?? undefined;
  const targetCommentId = readOptionalString(payload.target_comment_id) ?? undefined;

  if (targetType === 'post') {
    assertUuidLike(targetPostId ?? null, 'target_post_id');
  } else {
    assertUuidLike(targetCommentId ?? null, 'target_comment_id');
  }

  const reportIds = Array.isArray(payload.report_ids)
    ? payload.report_ids.map((reportId, index) => {
        const normalizedReportId = readRequiredTrimmedString(
          reportId,
          `report_ids[${index}]`,
        );
        assertUuidLike(normalizedReportId, `report_ids[${index}]`);
        return normalizedReportId;
      })
    : undefined;

  return {
    target_type: targetType,
    target_post_id: targetType === 'post' ? targetPostId : undefined,
    target_comment_id: targetType === 'comment' ? targetCommentId : undefined,
    action: action as SocialModerateContentRequest['action'],
    reason_code: normalizeOptionalFreeText(payload.reason_code, {
      fieldName: 'reason_code',
      maxLength: 100,
    }),
    note: normalizeOptionalFreeText(payload.note, {
      fieldName: 'note',
      maxLength: PHASE2_SOCIAL_MODERATION_NOTE_MAX_LENGTH,
    }),
    report_ids: reportIds && reportIds.length > 0 ? Array.from(new Set(reportIds)) : undefined,
  };
}

export function parseCoachGenerateRequest(payload: unknown): CoachGenerateRequest {
  if (!isRecord(payload)) {
    throw new Phase2HttpError(400, 'invalid_payload', 'Request body must be an object');
  }

  assertNoUnknownKeys(payload, COACH_GENERATE_ALLOWED_KEYS);

  if (!isRecord(payload.payload)) {
    throw new Phase2HttpError(
      400,
      'invalid_payload',
      'payload must be a normalized object',
    );
  }

  if (!isCoachPersonaKey(payload.persona_key)) {
    throw new Phase2HttpError(
      400,
      'invalid_coach_persona',
      'persona_key is not supported',
    );
  }

  return {
    payload: payload.payload,
    persona_key: payload.persona_key,
    locale: readOptionalString(payload.locale) ?? undefined,
    force_refresh: readOptionalBoolean(payload.force_refresh) ?? undefined,
  };
}

export function parseSocialReserveUploadRequest(payload: unknown) {
  if (!isRecord(payload)) {
    throw new Phase2HttpError(400, 'invalid_payload', 'Request body must be an object');
  }

  assertNoUnknownKeys(payload, ['mime_type']);

  return {
    mime_type: normalizeSocialImageMimeType(payload.mime_type),
  };
}

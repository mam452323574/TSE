import { handleCorsPreflightRequest, jsonResponse } from '../_shared/cors.ts';
import { createServiceRoleClient, getSupabaseUrlOrThrow, requireAuthenticatedUser } from '../_shared/phase2Auth.ts';
import { loadPhase2FeatureFlags, requireFeatureEnabled } from '../_shared/phase2Config.ts';
import { parseSocialCreatePostRequest } from '../_shared/phase2Contracts.ts';
import {
  createPhase2DatabaseError,
  getPhase2ErrorStatus,
  Phase2HttpError,
  toPhase2ErrorPayload,
} from '../_shared/phase2Errors.ts';
import {
  createRequestId,
  logPhase2Error,
} from '../_shared/phase2Observability.ts';
import {
  buildInitialSocialModerationFields,
  resolveSocialPublishModerationResult,
} from '../_shared/phase2Moderation.ts';
import { assertNoRecentDuplicatePost, assertOwnedScan, fetchViewerProfileSnapshot, getSocialRateLimit, getSocialRejectionCooldown, resolveReservedSocialUpload } from '../_shared/phase2Social.ts';
import { PHASE2_SOCIAL_BUCKET, PHASE2_SOCIAL_REQUEST_MAX_BYTES, buildPublicStorageUrl, normalizeSocialText, readJsonBody, sha256Hex } from '../_shared/phase2Utils.ts';
import type { Phase2ModerationState, SocialCreatePostResponse } from '../_shared/phase2Types.ts';

function requirePostMethod(req: Request) {
  if (req.method !== 'POST') {
    throw new Phase2HttpError(405, 'method_not_allowed', 'Method not allowed');
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }
  const requestId = createRequestId();

  try {
    requirePostMethod(req);

    const supabase = createServiceRoleClient();
    const supabaseUrl = getSupabaseUrlOrThrow();
    const user = await requireAuthenticatedUser(supabase, req);
    const featureFlags = await loadPhase2FeatureFlags(supabase);
    requireFeatureEnabled(
      featureFlags.social_enabled,
      'social_disabled',
      'Social posting is currently disabled',
    );

    const requestBody = parseSocialCreatePostRequest(
      await readJsonBody(req, { maxBytes: PHASE2_SOCIAL_REQUEST_MAX_BYTES }),
    );
    const rateLimit = await getSocialRateLimit(supabase, 'post', user.id);
    if (!rateLimit.allowed) {
      throw new Phase2HttpError(
        429,
        'post_rate_limit_reached',
        'Post rate limit reached',
        { rate_limit: rateLimit },
      );
    }

    const cooldown = await getSocialRejectionCooldown(supabase, user.id);
    if (cooldown.active) {
      throw new Phase2HttpError(
        429,
        'rejected_content_cooldown_active',
        'Posting is temporarily unavailable after repeated rejected content',
        { cooldown },
      );
    }

    if (requestBody.scan_id) {
      await assertOwnedScan(supabase, user.id, requestBody.scan_id);
    }

    const moderationPlan = resolveSocialPublishModerationResult({
      moderationEnabled: featureFlags.moderation_enabled,
    });
    const reservedUpload = requestBody.upload_id
      ? await resolveReservedSocialUpload(supabase, {
        userId: user.id,
        uploadId: requestBody.upload_id,
        reservedAssetPath: requestBody.reserved_asset_path,
      })
      : null;

    const profileSnapshot = await fetchViewerProfileSnapshot(supabase, user.id);
    const assetPath = reservedUpload?.asset_path ?? null;
    const assetUrl = assetPath
      ? buildPublicStorageUrl(supabaseUrl, PHASE2_SOCIAL_BUCKET, assetPath)
      : null;
    const normalizedContentText = requestBody.content_text
      ? normalizeSocialText(requestBody.content_text)
      : null;
    const contentHash = normalizedContentText
      ? await sha256Hex(normalizedContentText)
      : null;
    const assetHash = assetPath
      ? await sha256Hex(assetPath)
      : null;
    const initialModerationFields = buildInitialSocialModerationFields(
      moderationPlan.moderation_state,
    );

    await assertNoRecentDuplicatePost(supabase, user.id, {
      contentHash,
      assetHash,
    });

    const { data: createdPost, error: createError } = await supabase
      .from('social_posts')
      .insert({
        author_id: user.id,
        author_username: profileSnapshot.username,
        author_avatar_url: profileSnapshot.avatar_url,
        category: requestBody.category,
        scan_id: requestBody.scan_id ?? null,
        content_text: normalizedContentText,
        share_payload_snapshot: requestBody.share_payload_snapshot ?? null,
        asset_path: assetPath,
        asset_url: assetUrl,
        content_hash: contentHash,
        asset_hash: assetHash,
        moderation_state: moderationPlan.moderation_state,
        ...initialModerationFields,
      })
      .select('id, moderation_state, asset_url')
      .single();

    if (createError || !createdPost) {
      throw createPhase2DatabaseError(createError, {
        contextLabel: 'Social publish',
        fallbackCode: 'social_post_create_failed',
        fallbackMessage: 'Failed to create social post',
        relationName: 'social_posts',
      });
    }

    const moderationState = createdPost.moderation_state as Phase2ModerationState;

    const responseBody: SocialCreatePostResponse = {
      success: true,
      post_id: createdPost.id,
      moderation_state: moderationState,
      published: moderationState === 'approved',
      asset_url: createdPost.asset_url ?? null,
      rate_limit: rateLimit,
      cooldown,
    };

    return jsonResponse(req, responseBody);
  } catch (error) {
    logPhase2Error('[social-create-post] Request failed', error, {
      request_id: requestId,
    });
    return jsonResponse(req, toPhase2ErrorPayload(error, { requestId }), {
      status: getPhase2ErrorStatus(error),
    });
  }
});

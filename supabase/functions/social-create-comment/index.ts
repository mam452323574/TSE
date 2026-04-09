import { handleCorsPreflightRequest, jsonResponse } from '../_shared/cors.ts';
import { createServiceRoleClient, requireAuthenticatedUser } from '../_shared/phase2Auth.ts';
import { loadPhase2FeatureFlags, requireFeatureEnabled } from '../_shared/phase2Config.ts';
import { parseSocialCreateCommentRequest } from '../_shared/phase2Contracts.ts';
import { getOptionalWebhookUrl } from '../_shared/phase2Env.ts';
import {
  createPhase2DatabaseError,
  getPhase2ErrorStatus,
  Phase2HttpError,
  toPhase2ErrorPayload,
} from '../_shared/phase2Errors.ts';
import {
  createRequestId,
  logPhase2Error,
  summarizeProviderPayload,
} from '../_shared/phase2Observability.ts';
import {
  normalizeModerationState,
  resolveSocialPublishModerationResult,
} from '../_shared/phase2Moderation.ts';
import { assertCommentableSocialPost, assertNoRecentDuplicateComment, fetchViewerProfileSnapshot, getSocialRateLimit, getSocialRejectionCooldown } from '../_shared/phase2Social.ts';
import { postWebhookJson } from '../_shared/phase2Webhook.ts';
import { PHASE2_SOCIAL_REQUEST_MAX_BYTES, normalizeSocialText, readJsonBody, readOptionalString, sha256Hex } from '../_shared/phase2Utils.ts';
import type { Phase2ModerationState, SocialCreateCommentResponse } from '../_shared/phase2Types.ts';

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
    const user = await requireAuthenticatedUser(supabase, req);
    const featureFlags = await loadPhase2FeatureFlags(supabase);
    requireFeatureEnabled(
      featureFlags.social_enabled,
      'social_disabled',
      'Social comments are currently disabled',
    );
    requireFeatureEnabled(
      featureFlags.social_comments_enabled,
      'social_comments_disabled',
      'Social comments are currently disabled',
    );

    const requestBody = parseSocialCreateCommentRequest(
      await readJsonBody(req, { maxBytes: PHASE2_SOCIAL_REQUEST_MAX_BYTES }),
    );
    await assertCommentableSocialPost(supabase, requestBody.post_id);

    const rateLimit = await getSocialRateLimit(supabase, 'comment', user.id);
    if (!rateLimit.allowed) {
      throw new Phase2HttpError(
        429,
        'comment_rate_limit_reached',
        'Comment rate limit reached',
        { rate_limit: rateLimit },
      );
    }

    const cooldown = await getSocialRejectionCooldown(supabase, user.id);
    if (cooldown.active) {
      throw new Phase2HttpError(
        429,
        'rejected_content_cooldown_active',
        'Commenting is temporarily unavailable after repeated rejected content',
        { cooldown },
      );
    }

    const moderationWebhookUrl = getOptionalWebhookUrl(
      'N8N_SOCIAL_CREATE_COMMENT_WEBHOOK_URL',
    );
    const moderationPlan = resolveSocialPublishModerationResult({
      moderationEnabled: featureFlags.moderation_enabled,
      webhookConfigured: moderationWebhookUrl.length > 0,
      missingWebhookCode: 'social_comment_moderation_webhook_not_configured',
      missingWebhookMessage: 'Social comment moderation provider is not configured',
    });
    const profileSnapshot = await fetchViewerProfileSnapshot(supabase, user.id);
    const normalizedContentText = normalizeSocialText(requestBody.content_text);
    const contentHash = await sha256Hex(normalizedContentText);

    await assertNoRecentDuplicateComment(supabase, user.id, contentHash);
    const { data: createdComment, error: createError } = await supabase
      .from('social_comments')
      .insert({
        post_id: requestBody.post_id,
        author_id: user.id,
        author_username: profileSnapshot.username,
        author_avatar_url: profileSnapshot.avatar_url,
        content_text: normalizedContentText,
        content_hash: contentHash,
        moderation_state: moderationPlan.moderation_state,
      })
      .select('id, moderation_state, post_id')
      .single();

    if (createError || !createdComment) {
      throw createPhase2DatabaseError(createError, {
        contextLabel: 'Social comment publish',
        fallbackCode: 'social_comment_create_failed',
        fallbackMessage: 'Failed to create social comment',
        relationName: 'social_comments',
      });
    }

    let moderationState = createdComment.moderation_state as Phase2ModerationState;
    const cleanupCreatedComment = async () => {
      await supabase.from('social_comments').delete().eq('id', createdComment.id);
    };

    if (moderationPlan.shouldQueueWebhook) {
      let webhookResult: Awaited<ReturnType<typeof postWebhookJson>>;

      try {
        webhookResult = await postWebhookJson(moderationWebhookUrl, {
          comment_id: createdComment.id,
          post_id: requestBody.post_id,
          user_id: user.id,
          content_text: normalizedContentText,
        });
      } catch {
        await cleanupCreatedComment();
        throw new Phase2HttpError(
          502,
          'social_comment_moderation_webhook_failed',
          'Social comment moderation provider could not be reached',
        );
      }

      if (!webhookResult.ok) {
        await cleanupCreatedComment();
        throw new Phase2HttpError(
          502,
          'social_comment_moderation_webhook_failed',
          'Social comment moderation provider returned an error',
        );
      }

      if (!webhookResult.payload) {
        await cleanupCreatedComment();
        throw new Phase2HttpError(
          502,
          'social_comment_moderation_invalid_response',
          'Social comment moderation provider returned an invalid payload',
        );
      }

      moderationState = normalizeModerationState(
        readOptionalString(webhookResult.payload?.moderation_state),
        'pending',
      );

      const { error: updateError } = await supabase
        .from('social_comments')
        .update({
          moderation_state: moderationState,
          moderation_reason:
            readOptionalString(webhookResult.payload?.moderation_reason) ?? null,
          moderation_provider:
            readOptionalString(webhookResult.payload?.moderation_provider) ?? 'n8n',
          moderation_summary_json: summarizeProviderPayload(webhookResult.payload, {
            provider: 'n8n',
          }),
        })
        .eq('id', createdComment.id);

      if (updateError) {
        await cleanupCreatedComment();
        throw createPhase2DatabaseError(updateError, {
          contextLabel: 'Social comment publish finalization',
          fallbackCode: 'social_comment_finalize_failed',
          fallbackMessage: 'Failed to finalize the social comment moderation state',
          relationName: 'social_comments',
        });
      }
    }

    const responseBody: SocialCreateCommentResponse = {
      success: true,
      comment_id: createdComment.id,
      post_id: createdComment.post_id,
      moderation_state: moderationState,
      published: moderationState === 'approved',
      rate_limit: rateLimit,
      cooldown,
    };

    return jsonResponse(req, responseBody);
  } catch (error) {
    logPhase2Error('[social-create-comment] Request failed', error, {
      request_id: requestId,
    });
    return jsonResponse(req, toPhase2ErrorPayload(error, { requestId }), {
      status: getPhase2ErrorStatus(error),
    });
  }
});

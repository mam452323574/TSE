import { handleCorsPreflightRequest, jsonResponse } from '../_shared/cors.ts';
import { createServiceRoleClient, requireAuthenticatedUser } from '../_shared/phase2Auth.ts';
import { loadPhase2FeatureFlags, requireFeatureEnabled } from '../_shared/phase2Config.ts';
import { parseSocialToggleLikeRequest } from '../_shared/phase2Contracts.ts';
import { getPhase2ErrorStatus, Phase2HttpError, toPhase2ErrorPayload } from '../_shared/phase2Errors.ts';
import {
  createRequestId,
  logPhase2Error,
} from '../_shared/phase2Observability.ts';
import { getVisibleSocialPost } from '../_shared/phase2Social.ts';
import { PHASE2_SOCIAL_REQUEST_MAX_BYTES, readJsonBody } from '../_shared/phase2Utils.ts';
import type { SocialToggleLikeResponse } from '../_shared/phase2Types.ts';

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
      'Social likes are currently disabled',
    );

    const requestBody = parseSocialToggleLikeRequest(
      await readJsonBody(req, { maxBytes: PHASE2_SOCIAL_REQUEST_MAX_BYTES }),
    );
    await getVisibleSocialPost(supabase, user.id, requestBody.post_id);

    const { data: existingReaction, error: likeLookupError } = await supabase
      .from('social_post_likes')
      .select('reaction_type')
      .eq('post_id', requestBody.post_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (likeLookupError) {
      throw new Phase2HttpError(
        500,
        'social_like_lookup_failed',
        'Failed to look up social like state',
      );
    }

    const nextReaction =
      existingReaction?.reaction_type === 'like' ? 'neutral' : 'like';

    const { data: refreshedReaction, error: refreshedPostError } = await supabase.rpc(
      'set_social_post_reaction',
      {
        p_post_id: requestBody.post_id,
        p_user_id: user.id,
        p_reaction: nextReaction,
      },
    );

    const row = Array.isArray(refreshedReaction)
      ? refreshedReaction[0]
      : refreshedReaction;

    if (refreshedPostError || !row?.post_id) {
      throw new Phase2HttpError(
        500,
        'social_like_refresh_failed',
        'Failed to refresh social like count',
      );
    }

    const responseBody: SocialToggleLikeResponse = {
      success: true,
      post_id: row.post_id,
      liked: row.viewer_reaction === 'like',
      like_count: Number(row.like_count ?? 0),
      dislike_count: Number(row.dislike_count ?? 0),
      viewer_reaction:
        row.viewer_reaction === 'like' ||
        row.viewer_reaction === 'dislike' ||
        row.viewer_reaction === 'neutral'
          ? row.viewer_reaction
          : 'neutral',
    };

    return jsonResponse(req, responseBody);
  } catch (error) {
    logPhase2Error('[social-toggle-like] Request failed', error, {
      request_id: requestId,
    });
    return jsonResponse(req, toPhase2ErrorPayload(error, { requestId }), {
      status: getPhase2ErrorStatus(error),
    });
  }
});

import { handleCorsPreflightRequest, jsonResponse } from '../_shared/cors.ts';
import { createServiceRoleClient, requireAdminUserProfile, requireAuthenticatedUser } from '../_shared/phase2Auth.ts';
import { loadPhase2FeatureFlags, requireFeatureEnabled } from '../_shared/phase2Config.ts';
import { parseSocialModerateContentRequest } from '../_shared/phase2Contracts.ts';
import { getPhase2ErrorStatus, Phase2HttpError, toPhase2ErrorPayload } from '../_shared/phase2Errors.ts';
import {
  createRequestId,
  logPhase2Error,
} from '../_shared/phase2Observability.ts';
import { resolveModerationStateForAction } from '../_shared/phase2Moderation.ts';
import { PHASE2_SOCIAL_REQUEST_MAX_BYTES, readJsonBody } from '../_shared/phase2Utils.ts';
import type {
  Phase2ModerationState,
  SocialModerateContentResponse,
} from '../_shared/phase2Types.ts';

function requirePostMethod(req: Request) {
  if (req.method !== 'POST') {
    throw new Phase2HttpError(405, 'method_not_allowed', 'Method not allowed');
  }
}

function buildTargetScope(query: any, targetType: 'post' | 'comment', targetId: string) {
  return targetType === 'post'
    ? query.eq('target_post_id', targetId)
    : query.eq('target_comment_id', targetId);
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
    await requireAdminUserProfile(supabase, user.id);
    const featureFlags = await loadPhase2FeatureFlags(supabase);
    requireFeatureEnabled(
      featureFlags.social_enabled,
      'social_disabled',
      'Social moderation is currently disabled',
    );

    const requestBody = parseSocialModerateContentRequest(
      await readJsonBody(req, { maxBytes: PHASE2_SOCIAL_REQUEST_MAX_BYTES }),
    );

    const targetTable =
      requestBody.target_type === 'post' ? 'social_posts' : 'social_comments';
    const targetId =
      requestBody.target_type === 'post'
        ? requestBody.target_post_id!
        : requestBody.target_comment_id!;

    const { data: existingTarget, error: existingTargetError } = await supabase
      .from(targetTable)
      .select('id, author_id, moderation_state, moderation_reason, deleted_at')
      .eq('id', targetId)
      .maybeSingle();

    if (existingTargetError || !existingTarget) {
      throw new Phase2HttpError(404, 'moderation_target_not_found', 'Moderation target not found');
    }

    const previousState =
      typeof existingTarget.moderation_state === 'string'
        ? (existingTarget.moderation_state as Phase2ModerationState)
        : 'pending';
    const nextState = resolveModerationStateForAction(
      requestBody.action,
      previousState,
    );

    let appliedState: Phase2ModerationState | null = nextState;
    if (requestBody.action !== 'dismiss_reports') {
      const nextReason =
        requestBody.action === 'approve' || requestBody.action === 'restore'
          ? null
          : requestBody.reason_code ?? null;

      const { data: updatedTarget, error: updateTargetError } = await supabase
        .from(targetTable)
        .update({
          moderation_state: nextState,
          moderation_reason: nextReason,
          moderation_provider: 'admin',
          moderation_summary_json: {
            moderated_by: user.id,
            moderation_action: requestBody.action,
            moderation_note: requestBody.note ?? null,
            moderated_at: new Date().toISOString(),
          },
        })
        .eq('id', targetId)
        .select('id, moderation_state')
        .single();

      if (updateTargetError || !updatedTarget) {
        throw new Phase2HttpError(
          500,
          'moderation_target_update_failed',
          'Failed to update the moderation target',
        );
      }

      appliedState =
        typeof updatedTarget.moderation_state === 'string'
          ? (updatedTarget.moderation_state as Phase2ModerationState)
          : nextState;
    }

    let reportUpdateQuery = supabase
      .from('social_reports')
      .update({
        workflow_status:
          requestBody.action === 'dismiss_reports' ? 'dismissed' : 'resolved',
        moderation_state: nextState ?? previousState,
        moderation_reason: requestBody.reason_code ?? null,
        moderation_provider: 'admin',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        resolution_action: requestBody.action,
        resolution_note: requestBody.note ?? null,
      })
      .eq('target_type', requestBody.target_type);

    reportUpdateQuery = buildTargetScope(
      reportUpdateQuery,
      requestBody.target_type,
      targetId,
    );

    if (requestBody.report_ids && requestBody.report_ids.length > 0) {
      reportUpdateQuery = reportUpdateQuery.in('id', requestBody.report_ids);
    }

    const { data: updatedReports, error: updatedReportsError } = await reportUpdateQuery
      .select('id');

    if (updatedReportsError) {
      throw new Phase2HttpError(
        500,
        'moderation_report_update_failed',
        'Failed to update linked reports',
      );
    }

    const linkedReportIds = (Array.isArray(updatedReports) ? updatedReports : [])
      .map((report) => report.id)
      .filter((reportId): reportId is string => typeof reportId === 'string' && reportId.length > 0);

    const { data: moderationEvent, error: moderationEventError } = await supabase
      .from('social_moderation_events')
      .insert({
        target_type: requestBody.target_type,
        target_post_id: requestBody.target_type === 'post' ? targetId : null,
        target_comment_id: requestBody.target_type === 'comment' ? targetId : null,
        actor_id: user.id,
        action: requestBody.action,
        previous_moderation_state: previousState,
        next_moderation_state: appliedState,
        reason_code: requestBody.reason_code ?? null,
        note: requestBody.note ?? null,
        linked_report_ids: linkedReportIds,
        metadata_json: {
          target_author_id: existingTarget.author_id ?? null,
          affected_reports: linkedReportIds.length,
        },
      })
      .select('id')
      .single();

    if (moderationEventError || !moderationEvent) {
      throw new Phase2HttpError(
        500,
        'moderation_audit_create_failed',
        'Failed to create moderation audit event',
      );
    }

    const responseBody: SocialModerateContentResponse = {
      success: true,
      target_type: requestBody.target_type,
      target_id: targetId,
      action: requestBody.action,
      moderation_state: appliedState,
      affected_reports: linkedReportIds.length,
      event_id: moderationEvent.id,
    };

    return jsonResponse(req, responseBody);
  } catch (error) {
    logPhase2Error('[social-moderate-content] Request failed', error, {
      request_id: requestId,
    });
    return jsonResponse(req, toPhase2ErrorPayload(error, { requestId }), {
      status: getPhase2ErrorStatus(error),
    });
  }
});

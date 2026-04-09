import { handleCorsPreflightRequest, jsonResponse } from '../_shared/cors.ts';
import {
  createServiceRoleClient,
  requireAuthenticatedUser,
} from '../_shared/phase2Auth.ts';
import { loadPhase2FeatureFlags, requireFeatureEnabled } from '../_shared/phase2Config.ts';
import { parseSocialReserveUploadRequest } from '../_shared/phase2Contracts.ts';
import {
  getPhase2ErrorStatus,
  Phase2HttpError,
  toPhase2ErrorPayload,
} from '../_shared/phase2Errors.ts';
import {
  createRequestId,
  logPhase2Error,
} from '../_shared/phase2Observability.ts';
import {
  PHASE2_SOCIAL_BUCKET,
  PHASE2_SOCIAL_REQUEST_MAX_BYTES,
  buildReservedSocialUploadPath,
  readJsonBody,
} from '../_shared/phase2Utils.ts';
import type { SocialReserveUploadResponse } from '../_shared/phase2Types.ts';

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
      'Social posting is currently disabled',
    );

    const requestBody = parseSocialReserveUploadRequest(
      await readJsonBody(req, { maxBytes: PHASE2_SOCIAL_REQUEST_MAX_BYTES }),
    );
    const uploadId = crypto.randomUUID();
    const assetPath = buildReservedSocialUploadPath(
      user.id,
      uploadId,
      requestBody.mime_type,
    );

    const responseBody: SocialReserveUploadResponse = {
      success: true,
      upload_id: uploadId,
      asset_path: assetPath,
      bucket: PHASE2_SOCIAL_BUCKET,
      mime_type: requestBody.mime_type,
    };

    return jsonResponse(req, responseBody);
  } catch (error) {
    logPhase2Error('[social-reserve-upload] Request failed', error, {
      request_id: requestId,
    });
    return jsonResponse(req, toPhase2ErrorPayload(error, { requestId }), {
      status: getPhase2ErrorStatus(error),
    });
  }
});

import { handleCorsPreflightRequest, jsonResponse } from '../_shared/cors.ts';
import { createServiceRoleClient, requireAuthenticatedUser } from '../_shared/phase2Auth.ts';
import { requireWebhookUrl } from '../_shared/phase2Env.ts';
import { Phase2HttpError, toPhase2ErrorPayload } from '../_shared/phase2Errors.ts';
import {
  createRequestId,
  logPhase2Error,
  summarizeWebhookResult,
} from '../_shared/phase2Observability.ts';
import { postWebhookJson } from '../_shared/phase2Webhook.ts';
import {
  isPendingScanRollback,
  rollbackScanCharge,
  type PendingScanRollback,
  type SupportedScanType,
} from '../_shared/scanReservations.ts';
import { assertNoUnknownKeys, assertUuidLike, buildCanonicalScanImagePath, readJsonBody } from '../_shared/phase2Utils.ts';
import {
  arrayBufferToBase64,
  isStoredScanAnalysisComplete,
  normalizeScanAnalysisLanguage,
  resolveNormalizedScanAnalysisPayload,
} from '../_shared/scanAnalysis.ts';
import {
  ANALYZE_SCAN_REQUEST_KEYS,
  SCAN_IMAGE_BUCKET,
  isAppScanType,
} from '../../../shared/scanContract.ts';

function requirePostMethod(req: Request) {
  if (req.method !== 'POST') {
    throw new Phase2HttpError(405, 'method_not_allowed', 'Method not allowed');
  }
}

function readScanType(value: unknown): SupportedScanType {
  if (isAppScanType(value)) {
    return value as SupportedScanType;
  }

  throw new Phase2HttpError(400, 'invalid_scan_type', 'scan_type is invalid');
}

function resolveScanWebhookUrl(scanType: SupportedScanType) {
  const defaultWebhookUrl = requireWebhookUrl('N8N_SCAN_ANALYZE_WEBHOOK_URL', {
    code: 'scan_webhook_not_configured',
    message: 'Scan analysis provider is not configured',
  });
  const superWebhookUrl =
    Deno.env.get('N8N_SCAN_ANALYZE_SUPER_WEBHOOK_URL')?.trim() ||
    defaultWebhookUrl;

  return scanType === 'super' ? superWebhookUrl : defaultWebhookUrl;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }
  const requestId = createRequestId();
  let pendingRollback: PendingScanRollback | null = null;
  let client: ReturnType<typeof createServiceRoleClient> | null = null;

  try {
    requirePostMethod(req);
    client = createServiceRoleClient();

    const user = await requireAuthenticatedUser(client, req);
    const requestBody = await readJsonBody(req, { maxBytes: 8 * 1024 });
    if (
      !requestBody ||
      typeof requestBody !== 'object' ||
      Array.isArray(requestBody)
    ) {
      throw new Phase2HttpError(400, 'invalid_payload', 'Request body must be an object');
    }

    assertNoUnknownKeys(
      requestBody as Record<string, unknown>,
      ANALYZE_SCAN_REQUEST_KEYS,
      'Analyze scan request',
    );

    const scanId = typeof requestBody.scan_id === 'string' ? requestBody.scan_id : null;
    assertUuidLike(scanId, 'scan_id');
    const requestedScanType = readScanType(requestBody.scan_type);
    const language = normalizeScanAnalysisLanguage(requestBody.language);

    const { data: scanRow, error: scanError } = await client
      .from('scans')
      .select(
        'id, user_id, scan_type, created_at, used_welcome_credit, image_path, analysis_result, analyzed_at',
      )
      .eq('id', scanId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (scanError || !scanRow) {
      throw new Phase2HttpError(404, 'scan_not_found', 'Scan not found');
    }

    if (scanRow.scan_type !== requestedScanType) {
      throw new Phase2HttpError(
        403,
        'scan_type_mismatch',
        'scan_type must match the existing scan record',
      );
    }

    const canonicalPath = buildCanonicalScanImagePath(user.id, scanRow.id);
    if (isStoredScanAnalysisComplete(scanRow)) {
      return jsonResponse(req, {
        success: true,
        scan: {
          ...scanRow,
          image_path: scanRow.image_path ?? canonicalPath,
        },
      });
    }

    pendingRollback = {
      scanId: scanRow.id,
      userId: user.id,
      scanType: requestedScanType,
      createdAt: scanRow.created_at,
      usedWelcomeCredit: scanRow.used_welcome_credit === true,
      canonicalPath,
    };

    const { data: storageRow, error: storageLookupError } = await client
      .schema('storage')
      .from('objects')
      .select('name, metadata')
      .eq('bucket_id', SCAN_IMAGE_BUCKET)
      .eq('name', canonicalPath)
      .maybeSingle();

    if (storageLookupError || !storageRow) {
      throw new Phase2HttpError(
        404,
        'scan_image_not_found',
        'Uploaded scan image was not found at the canonical storage path',
      );
    }

    const metadata = storageRow.metadata as Record<string, unknown> | null;
    const mimeType =
      typeof metadata?.mimetype === 'string'
        ? metadata.mimetype.toLowerCase()
        : typeof metadata?.contentType === 'string'
          ? metadata.contentType.toLowerCase()
          : null;

    if (mimeType && mimeType !== 'image/jpeg' && mimeType !== 'image/jpg') {
      throw new Phase2HttpError(
        400,
        'invalid_scan_image_type',
        'Scan uploads must be JPEG images',
      );
    }

    const { data: scanImage, error: downloadError } = await client.storage
      .from(SCAN_IMAGE_BUCKET)
      .download(canonicalPath);

    if (downloadError || !scanImage) {
      throw new Phase2HttpError(
        404,
        'scan_image_not_found',
        'Uploaded scan image could not be downloaded',
      );
    }

    const imageBase64 = arrayBufferToBase64(await scanImage.arrayBuffer());
    const webhookResult = await postWebhookJson(
      resolveScanWebhookUrl(requestedScanType),
      {
        scanId: scanRow.id,
        userId: user.id,
        scanType: requestedScanType,
        language,
        imageBase64,
      },
      60000,
    );

    if (!webhookResult.ok) {
      throw new Phase2HttpError(
        502,
        'analysis_provider_failed',
        'Scan analysis provider returned an error',
        summarizeWebhookResult(webhookResult, {
          provider: 'scan_analysis',
        }),
      );
    }

    const analysisResult = resolveNormalizedScanAnalysisPayload(
      webhookResult.payload,
      requestedScanType,
    );

    const analyzedAt = new Date().toISOString();
    const { data: updatedScan, error: updateScanError } = await client
      .from('scans')
      .update({
        image_path: canonicalPath,
        image_url: null,
        analysis_result: analysisResult,
        analyzed_at: analyzedAt,
      })
      .eq('id', scanRow.id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateScanError || !updatedScan) {
      throw new Phase2HttpError(
        500,
        'scan_persistence_failed',
        'Failed to persist analyzed scan',
      );
    }

    pendingRollback = null;

    return jsonResponse(req, {
      success: true,
      scan: updatedScan,
    });
  } catch (error) {
    if (client && isPendingScanRollback(pendingRollback)) {
      try {
        await rollbackScanCharge(client, pendingRollback);
      } catch (refundError) {
        logPhase2Error('[analyze-scan] Refund rollback failed', refundError, {
          request_id: requestId,
          scan_id: pendingRollback.scanId,
          user_id: pendingRollback.userId,
        });
      }
    }

    if (error instanceof Phase2HttpError) {
      logPhase2Error('[analyze-scan] Request failed', error, {
        request_id: requestId,
        scan_id: pendingRollback?.scanId,
        user_id: pendingRollback?.userId,
      });
      return jsonResponse(
        req,
        toPhase2ErrorPayload(error, { requestId }),
        { status: error.status },
      );
    }

    logPhase2Error('[analyze-scan] Unexpected error', error, {
      request_id: requestId,
      scan_id: pendingRollback?.scanId,
      user_id: pendingRollback?.userId,
    });
    return jsonResponse(
      req,
      toPhase2ErrorPayload(error, { requestId }),
      { status: 500 },
    );
  }
});

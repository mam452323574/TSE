import { handleCorsPreflightRequest, jsonResponse } from '../_shared/cors.ts';
import {
  requireCoachGenerateWebhookUrl,
} from '../_shared/coachProvider.ts';
import { createServiceRoleClient, requireAuthenticatedUser } from '../_shared/phase2Auth.ts';
import { loadPhase2FeatureFlags, requireFeatureEnabled } from '../_shared/phase2Config.ts';
import { parseCoachGenerateRequest } from '../_shared/phase2Contracts.ts';
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
  summarizeWebhookResult,
} from '../_shared/phase2Observability.ts';
import { postWebhookJson } from '../_shared/phase2Webhook.ts';
import { buildNormalizedPayloadHash, isRecord, readJsonBody, readOptionalString } from '../_shared/phase2Utils.ts';
import type { CoachGenerateResponse, Phase2CoachEntryStatus } from '../_shared/phase2Types.ts';
import {
  DEFAULT_COACH_PERSONA_KEY,
  getCoachPersona,
  hasCoachPersonaAccess,
  isCoachPersonaKey,
} from '../../../shared/coachPersonas.ts';

const DEFAULT_COACH_DISCLAIMER =
  'Wellness guidance only. This is not a diagnosis or medical advice.';

function requirePostMethod(req: Request) {
  if (req.method !== 'POST') {
    throw new Phase2HttpError(405, 'method_not_allowed', 'Method not allowed');
  }
}

function resolveCoachPayload(payload: Record<string, unknown> | null) {
  const basePayload =
    payload && isRecord(payload.entry) ? payload.entry : payload;

  if (!basePayload || !isRecord(basePayload)) {
    throw new Phase2HttpError(
      502,
      'invalid_coach_response',
      'Coach webhook returned an invalid payload',
    );
  }

  const title = readOptionalString(basePayload.title);
  const body = readOptionalString(basePayload.body);

  if (!title || !body) {
    throw new Phase2HttpError(
      502,
      'invalid_coach_response',
      'Coach webhook response must include title and body',
    );
  }

  return {
    title,
    body,
    disclaimer:
      readOptionalString(basePayload.disclaimer) ?? DEFAULT_COACH_DISCLAIMER,
    cta_label: readOptionalString(basePayload.cta_label),
    cta_route: readOptionalString(basePayload.cta_route),
    source: readOptionalString(basePayload.source) ?? 'n8n',
    expires_at: readOptionalString(basePayload.expires_at),
  };
}

async function computeCoachCacheKey(client: any, userId: string, inputHash: string) {
  const { data, error } = await client.rpc('compute_coach_cache_key', {
    p_user_id: userId,
    p_input_hash: inputHash,
  });

  if (error) {
    return `${userId}:${inputHash}`;
  }

  if (typeof data === 'string' && data.length > 0) {
    return data;
  }

  if (Array.isArray(data) && typeof data[0] === 'string' && data[0].length > 0) {
    return data[0];
  }

  return `${userId}:${inputHash}`;
}

function isFreshCoachEntry(entry: any) {
  if (!entry || entry.status !== 'ready') {
    return false;
  }

  if (!entry.expires_at) {
    return true;
  }

  return new Date(entry.expires_at).getTime() > Date.now();
}

function buildCoachResponse(entry: any, cached: boolean): CoachGenerateResponse {
  return {
    success: true,
    cached,
    entry_id: entry.id,
    persona_key: isCoachPersonaKey(entry.persona_key)
      ? entry.persona_key
      : DEFAULT_COACH_PERSONA_KEY,
    status: (entry.status as Phase2CoachEntryStatus) ?? 'pending',
    title: typeof entry.title === 'string' ? entry.title : null,
    body: typeof entry.body === 'string' ? entry.body : null,
    disclaimer:
      typeof entry.disclaimer === 'string' && entry.disclaimer.trim().length > 0
        ? entry.disclaimer
        : DEFAULT_COACH_DISCLAIMER,
    cta_label: typeof entry.cta_label === 'string' ? entry.cta_label : null,
    cta_route: typeof entry.cta_route === 'string' ? entry.cta_route : null,
    source: typeof entry.source === 'string' ? entry.source : null,
    expires_at: typeof entry.expires_at === 'string' ? entry.expires_at : null,
    response_payload_json:
      isRecord(entry.response_payload_json) ? entry.response_payload_json : {},
  };
}

async function loadUserAccountTier(client: any, userId: string) {
  const { data, error } = await client
    .from('user_profiles')
    .select('account_tier')
    .eq('id', userId)
    .single();

  if (error) {
    throw createPhase2DatabaseError(error, {
      contextLabel: 'Coach generation user profile lookup',
      fallbackCode: 'user_profile_lookup_failed',
      fallbackMessage: 'Failed to load the user profile for coach generation',
      relationName: 'user_profiles',
    });
  }

  if (!data?.account_tier) {
    throw new Phase2HttpError(
      404,
      'user_profile_not_found',
      'User profile not found for coach generation',
    );
  }

  return data.account_tier as string;
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
      featureFlags.coach_enabled,
      'coach_disabled',
      'Coach generation is currently disabled',
    );

    const requestBody = parseCoachGenerateRequest(await readJsonBody(req));
    const accountTier = await loadUserAccountTier(supabase, user.id);
    if (!hasCoachPersonaAccess(requestBody.persona_key, accountTier)) {
      throw new Phase2HttpError(
        403,
        'coach_persona_requires_premium',
        'This coach persona requires premium access',
      );
    }

    const persona = getCoachPersona(requestBody.persona_key);
    const inputHash = await buildNormalizedPayloadHash({
      payload: requestBody.payload,
      persona_key: requestBody.persona_key,
    });
    const cacheKey = await computeCoachCacheKey(supabase, user.id, inputHash);

    const { data: existingEntry, error: existingEntryError } = await supabase
      .from('coach_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (existingEntryError) {
      throw createPhase2DatabaseError(existingEntryError, {
        contextLabel: 'Coach generation cache lookup',
        fallbackCode: 'coach_entry_lookup_failed',
        fallbackMessage: 'Failed to look up existing coach entries',
        relationName: 'coach_entries',
      });
    }

    if (!requestBody.force_refresh && isFreshCoachEntry(existingEntry)) {
      return jsonResponse(req, buildCoachResponse(existingEntry, true));
    }

    const pendingValues = {
      user_id: user.id,
      cache_key: cacheKey,
      input_hash: inputHash,
      request_payload_json: requestBody.payload,
      response_payload_json: {},
      status: 'pending',
      error_code: null,
      source: 'n8n',
      persona_key: requestBody.persona_key,
      title: null,
      body: null,
      disclaimer: DEFAULT_COACH_DISCLAIMER,
      cta_label: null,
      cta_route: null,
      generated_at: null,
      expires_at: null,
    };

    const { data: pendingEntry, error: pendingEntryError } = await supabase
      .from('coach_entries')
      .upsert(pendingValues, {
        onConflict: 'user_id,cache_key',
      })
      .select('*')
      .single();

    if (pendingEntryError || !pendingEntry) {
      throw createPhase2DatabaseError(pendingEntryError, {
        contextLabel: 'Coach generation preparation',
        fallbackCode: 'coach_entry_upsert_failed',
        fallbackMessage: 'Failed to prepare coach entry generation',
        relationName: 'coach_entries',
      });
    }

    const webhookUrl = await requireCoachGenerateWebhookUrl(
      supabase,
      pendingEntry.id,
    );

    let webhookResult: Awaited<ReturnType<typeof postWebhookJson>>;

    try {
      webhookResult = await postWebhookJson(webhookUrl, {
        entry_id: pendingEntry.id,
        user_id: user.id,
        cache_key: cacheKey,
        input_hash: inputHash,
        persona_key: requestBody.persona_key,
        locale: requestBody.locale ?? null,
        persona: {
          key: persona.key,
          requires_premium: persona.requiresPremium,
          tone_instructions: persona.toneInstructions,
        },
        payload: requestBody.payload,
      });
    } catch {
      await supabase
        .from('coach_entries')
        .update({
          status: 'error',
          error_code: 'coach_webhook_unreachable',
          response_payload_json: summarizeProviderPayload(null, {
            error_code: 'coach_webhook_unreachable',
            source: 'coach_generation',
          }),
        })
        .eq('id', pendingEntry.id);

      throw new Phase2HttpError(
        502,
        'coach_webhook_failed',
        'Coach generation provider could not be reached',
      );
    }

    if (!webhookResult.ok) {
      await supabase
        .from('coach_entries')
        .update({
          status: 'error',
          error_code: `coach_webhook_${webhookResult.status}`,
          response_payload_json: summarizeWebhookResult(webhookResult, {
            provider: 'n8n',
            source: 'coach_generation',
            error_code: `coach_webhook_${webhookResult.status}`,
          }),
        })
        .eq('id', pendingEntry.id);

      throw new Phase2HttpError(
        502,
        'coach_webhook_failed',
        'Coach generation provider returned an error',
      );
    }

    const normalizedResponse = resolveCoachPayload(webhookResult.payload);
    const expiresAt =
      normalizedResponse.expires_at ??
      new Date(
        Date.now() + featureFlags.coach_cache_ttl_minutes * 60 * 1000,
      ).toISOString();

    const { data: finalEntry, error: finalEntryError } = await supabase
      .from('coach_entries')
      .update({
        title: normalizedResponse.title,
        body: normalizedResponse.body,
        disclaimer: normalizedResponse.disclaimer,
        cta_label: normalizedResponse.cta_label ?? null,
        cta_route: normalizedResponse.cta_route ?? null,
        source: normalizedResponse.source,
        response_payload_json: summarizeProviderPayload(webhookResult.payload, {
          source: normalizedResponse.source,
          status: 'ready',
        }),
        status: 'ready',
        error_code: null,
        generated_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .eq('id', pendingEntry.id)
      .select('*')
      .single();

    if (finalEntryError || !finalEntry) {
      throw createPhase2DatabaseError(finalEntryError, {
        contextLabel: 'Coach generation finalization',
        fallbackCode: 'coach_entry_finalize_failed',
        fallbackMessage: 'Failed to finalize coach response',
        relationName: 'coach_entries',
      });
    }

    return jsonResponse(req, buildCoachResponse(finalEntry, false));
  } catch (error) {
    logPhase2Error('[coach-generate-response] Request failed', error, {
      request_id: requestId,
    });
    return jsonResponse(req, toPhase2ErrorPayload(error, { requestId }), {
      status: getPhase2ErrorStatus(error),
    });
  }
});

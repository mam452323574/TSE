import { getRuntimeConfig, getSupabaseFunctionUrl } from './runtimeConfig';
import { supabase } from './supabase';

interface EdgeFunctionErrorPayload {
  error?: string;
  code?: string;
  details?: unknown;
  request_id?: string;
}

export interface EdgeFunctionInvokeErrorOptions {
  code?: string;
  status?: number;
  details?: unknown;
  requestId?: string;
  functionName: string;
}

interface InvokeAuthedEdgeFunctionOptions<TError extends Error> {
  scopeLabel: string;
  functionName: string;
  payload: Record<string, unknown>;
  createError: (message: string, options: EdgeFunctionInvokeErrorOptions) => TError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readEdgeFunctionErrorPayload(value: unknown): EdgeFunctionErrorPayload {
  if (!isRecord(value)) {
    return {};
  }

  return {
    error: typeof value.error === 'string' ? value.error : undefined,
    code: typeof value.code === 'string' ? value.code : undefined,
    details: value.details,
    request_id: typeof value.request_id === 'string' ? value.request_id : undefined,
  };
}

function extractSupabaseProjectRef(supabaseUrl: string) {
  const match = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co(?:\/|$)/i);
  return match?.[1] ?? null;
}

export function getConfiguredSupabaseProjectLabel() {
  try {
    const supabaseUrl = getRuntimeConfig().supabaseUrl;
    return extractSupabaseProjectRef(supabaseUrl) ?? supabaseUrl;
  } catch {
    return 'configured project';
  }
}

export function createMissingEdgeFunctionRouteMessage(
  scopeLabel: string,
  functionName: string,
) {
  return `${scopeLabel} route "${functionName}" is not deployed on Supabase project "${getConfiguredSupabaseProjectLabel()}" (404).`;
}

export async function invokeAuthedEdgeFunction<TResponse, TError extends Error>({
  scopeLabel,
  functionName,
  payload,
  createError,
}: InvokeAuthedEdgeFunctionOptions<TError>) {
  let functionUrl: string;

  try {
    functionUrl = getSupabaseFunctionUrl(functionName);
  } catch {
    throw createError('Supabase URL is not configured', {
      code: 'missing_supabase_url',
      status: 500,
      functionName,
    });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw createError('Authentication required', {
      code: 'missing_authentication',
      status: 401,
      functionName,
    });
  }

  let response: Response;
  try {
    response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        Accept: 'application/json; charset=utf-8',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw createError(
      error instanceof Error
        ? error.message
        : `${scopeLabel} route "${functionName}" could not be reached.`,
      {
        code: 'edge_function_network_error',
        details: error,
        functionName,
      },
    );
  }

  const responseText = await response.text();
  let responsePayload: unknown = null;
  if (responseText.trim().length > 0) {
    try {
      responsePayload = JSON.parse(responseText);
    } catch {
      responsePayload = null;
    }
  }

  if (!response.ok) {
    const errorPayload = readEdgeFunctionErrorPayload(responsePayload);
    const isMissingRoute = response.status === 404;

    throw createError(
      isMissingRoute
        ? createMissingEdgeFunctionRouteMessage(scopeLabel, functionName)
        : errorPayload.error || `${scopeLabel} route "${functionName}" failed (${response.status}).`,
      {
        code: errorPayload.code ?? (isMissingRoute ? 'edge_function_route_missing' : undefined),
        status: response.status,
        details: errorPayload.details ?? responsePayload,
        requestId: errorPayload.request_id,
        functionName,
      },
    );
  }

  return responsePayload as TResponse;
}

/**
 * Shared CORS helpers for Supabase Edge Functions.
 *
 * Configure allowed origins through the ALLOWED_ORIGINS environment variable.
 * Example:
 *   https://your-domain.com,http://localhost:8081,http://localhost:19006
 */

const allowedOriginsEnv = Deno.env.get('ALLOWED_ORIGINS') || '';
const allowedOrigins = allowedOriginsEnv
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

function isOriginAllowed(origin: string): boolean {
  if (allowedOrigins.length === 0) {
    console.warn('[CORS] No origins configured in ALLOWED_ORIGINS. Denying by default.');
    return false;
  }

  if (allowedOrigins.includes('*')) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';

  if (!origin) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
    };
  }

  const allowed = isOriginAllowed(origin);

  if (!allowed) {
    console.warn(`[CORS] Origin not allowed: ${origin}`);
  }

  return {
    'Access-Control-Allow-Origin': allowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function handleCorsPreflightRequest(req: Request): Response {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(req),
  });
}

export function jsonResponse(
  req: Request,
  payload: unknown,
  init: ResponseInit = {}
): Response {
  const headers = new Headers(init.headers);

  Object.entries(getCorsHeaders(req)).forEach(([key, value]) => {
    headers.set(key, value);
  });

  headers.set('Content-Type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(payload), {
    ...init,
    headers,
  });
}

export function validateCorsOrigin(req: Request): Response | null {
  const origin = req.headers.get('Origin');

  if (!origin) {
    return null;
  }

  if (!isOriginAllowed(origin)) {
    return jsonResponse(req, { error: 'Origin not allowed' }, { status: 403 });
  }

  return null;
}

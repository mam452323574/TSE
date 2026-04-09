import { handleCorsPreflightRequest, jsonResponse } from '../_shared/cors.ts';

// Legacy compatibility shim only. RevenueCat plus backend sync is the active path.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  return jsonResponse(
    req,
    {
      success: false,
      deprecated: true,
      legacy_only: true,
      error:
        'Legacy direct purchase verification is deprecated. Use RevenueCat client purchases with backend entitlement sync instead.',
      code: 'legacy_purchase_verification_deprecated',
    },
    { status: 410 },
  );
});

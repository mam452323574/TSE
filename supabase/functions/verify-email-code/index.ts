import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { handleCorsPreflightRequest, jsonResponse } from '../_shared/cors.ts';

const MAX_ATTEMPTS = 5;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { code, userId, type = 'signup' } = await req.json();

    if (!code || !userId) throw new Error('Missing data');

    // Récupérer le code valide
    const { data: verificationCode, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !verificationCode) {
      return jsonResponse(req, { error: 'CODE_NOT_FOUND', errorKey: 'auth.code_not_found' }, { status: 400 });
    }

    // Vérifications
    if (new Date(verificationCode.expires_at) < new Date()) {
      return jsonResponse(req, { error: 'CODE_EXPIRED', errorKey: 'auth.code_expired' }, { status: 410 });
    }
    if (verificationCode.attempts_count >= MAX_ATTEMPTS) {
      return jsonResponse(req, { error: 'TOO_MANY_ATTEMPTS', errorKey: 'auth.too_many_attempts' }, { status: 429 });
    }

    // Code incorrect
    if (String(verificationCode.code) !== String(code)) {
      const newAttempts = verificationCode.attempts_count + 1;
      await supabase.from('verification_codes').update({ attempts_count: newAttempts }).eq('id', verificationCode.id);
      const remainingAttempts = MAX_ATTEMPTS - newAttempts;
      return jsonResponse(
        req,
        {
          error: 'CODE_INCORRECT',
          errorKey: 'auth.code_incorrect',
          remainingAttempts
        },
        { status: 401 }
      );
    }

    // Code correct ! On valide.
    await supabase.from('verification_codes').update({ verified_at: new Date().toISOString() }).eq('id', verificationCode.id);
    await supabase.from('user_profiles').update({ email_verified: true }).eq('id', userId);

    return jsonResponse(req, { success: true, verified: true }, { status: 200 });

  } catch (error) {
    return jsonResponse(req, { error: 'Server Error' }, { status: 500 });
  }
});

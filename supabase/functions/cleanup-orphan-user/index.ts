import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { handleCorsPreflightRequest, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(req, { error: 'Missing authorization' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    const { userId } = await req.json();
    if (!userId) throw new Error('UserId required');

    if (authError || !authUser || authUser.id !== userId) {
      return jsonResponse(req, { error: 'Unauthorized' }, { status: 403 });
    }

    // Vérifier si déjà vérifié pour ne pas supprimer par erreur
    const { data: profile } = await supabase.from('user_profiles').select('email_verified').eq('id', userId).maybeSingle();

    if (profile?.email_verified) {
      return jsonResponse(req, { error: 'User already verified' }, { status: 403 });
    }

    // Suppression en cascade
    await supabase.from('verification_codes').delete().eq('user_id', userId);
    await supabase.from('trusted_devices').delete().eq('user_id', userId);
    await supabase.from('user_profiles').delete().eq('id', userId);

    // Suppression Auth finale
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return jsonResponse(req, { success: true }, { status: 200 });

  } catch (error) {
    console.error(error);
    return jsonResponse(req, { error: 'Failed to cleanup' }, { status: 500 });
  }
});

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return handleCorsPreflightRequest(req);
    }

    const corsHeaders = getCorsHeaders(req);

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Get IP address using standard headers
        const clientIp =
            req.headers.get('cf-connecting-ip') ||
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('x-real-ip') ||
            'unknown';

        if (clientIp === 'unknown') {
            console.warn('[CheckIP] Could not determine client IP');
            // Decide: Fail open or closed? Proceeding for now but logging warning.
        }

        const { action = 'check', userId } = await req.json().catch(() => ({}));

        // Action: RECORD a new signup
        if (action === 'record') {
            if (!userId) {
                return new Response(JSON.stringify({ error: 'UserID required for recording' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const { error } = await supabase.rpc('record_ip_signup', {
                client_ip: clientIp,
                p_user_id: userId
            });

            if (error) throw error;

            return new Response(
                JSON.stringify({ success: true }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Default Action: CHECK eligibility
        const { data, error } = await supabase.rpc('check_ip_signup_allowed', {
            client_ip: clientIp
        });

        if (error) {
            console.error('[CheckIP] Database error:', error);
            throw error;
        }

        const result = data && data[0] ? data[0] : { allowed: true };

        if (!result.allowed) {
            return new Response(
                JSON.stringify({
                    allowed: false,
                    reason: result.reason,
                    error: 'Signup limit reached'
                }),
                {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        return new Response(
            JSON.stringify({ allowed: true }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );


    } catch (error) {
        console.error('[CheckIP] Unexpected error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});

import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const getCorsHeaders = (req: Request) => {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  };
};

const handleCorsPreflightRequest = (req: Request) => {
  return new Response(null, {
    headers: getCorsHeaders(req),
  });
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('account_tier, subscription_expiry_date, subscription_status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    let updated = false;
    const now = new Date();

    if (
      (profile.account_tier === 'premium' ||
        profile.account_tier === 'admin') &&
      profile.subscription_expiry_date
    ) {
      const expiryDate = new Date(profile.subscription_expiry_date);

      if (expiryDate < now) {
        console.log(
          `[sync-subscription] Subscription expired for user ${user.id}. Expired at: ${expiryDate.toISOString()}`,
        );

        // Don't downgrade admin accounts
        if (profile.account_tier === 'admin') {
          console.log(
            `[sync-subscription] User ${user.id} has admin tier, retaining access despite expired subscription.`,
          );
        } else {
          const { error: updateError } = await supabaseClient
            .from('user_profiles')
            .update({
              account_tier: 'free',
              subscription_status: 'expired',
            })
            .eq('id', user.id);

          if (updateError) {
            throw updateError;
          }
          updated = true;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        message: updated
          ? 'Subscription expired and downgraded'
          : 'Subscription valid or no change needed',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error syncing subscription:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});

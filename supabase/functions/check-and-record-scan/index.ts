import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface ScanCheckRequest {
  scanType: 'body' | 'health' | 'nutrition' | 'super';
  checkOnly?: boolean;
}

interface ScanUsageRecord {
  last_scan_date: string | null;
  scan_timestamps: string[];
}

interface ScanUsage {
  health: ScanUsageRecord;
  body: ScanUsageRecord;
  nutrition: ScanUsageRecord;
  super: ScanUsageRecord;
}

interface WelcomeCredits {
  health: number;
  body: number;
  nutrition: number;
}

const SCAN_LIMITS: Record<
  string,
  Record<string, { count: number; periodMs: number }>
> = {
  free: {
    health: { count: 1, periodMs: 7 * 24 * 60 * 60 * 1000 },
    body: { count: 1, periodMs: 30 * 24 * 60 * 60 * 1000 },
    nutrition: { count: 1, periodMs: 3 * 24 * 60 * 60 * 1000 },
    super: { count: 0, periodMs: 24 * 60 * 60 * 1000 },
  },
  premium: {
    health: { count: 3, periodMs: 24 * 60 * 60 * 1000 },
    body: { count: 3, periodMs: 24 * 60 * 60 * 1000 },
    nutrition: { count: 3, periodMs: 24 * 60 * 60 * 1000 },
    super: { count: 1, periodMs: 24 * 60 * 60 * 1000 },
  },
  admin: {
    health: { count: 20, periodMs: 24 * 60 * 60 * 1000 },
    body: { count: 20, periodMs: 24 * 60 * 60 * 1000 },
    nutrition: { count: 20, periodMs: 24 * 60 * 60 * 1000 },
    super: { count: 20, periodMs: 24 * 60 * 60 * 1000 },
  },
};

const SCAN_MESSAGES: Record<string, Record<string, string>> = {
  free: {
    health: 'Limite hebdomadaire atteinte. Prochain scan disponible dans',
    body: 'Limite mensuelle atteinte. Prochain scan disponible dans',
    nutrition: 'Limite atteinte. Prochain scan disponible dans',
    super: 'Le Super Scan est réservé aux membres Premium',
  },
  premium: {
    health:
      'Limite quotidienne atteinte (3 scans). Prochain scan disponible dans',
    body: 'Limite quotidienne atteinte (3 scans). Prochain scan disponible dans',
    nutrition:
      'Limite quotidienne atteinte (3 scans). Prochain scan disponible dans',
    super:
      'Limite quotidienne atteinte (1 scan). Prochain scan disponible dans',
  },
  admin: {
    health: 'Limite administrateur atteinte (20 scans). Prochain scan demain.',
    body: 'Limite administrateur atteinte (20 scans). Prochain scan demain.',
    nutrition:
      'Limite administrateur atteinte (20 scans). Prochain scan demain.',
    super: 'Limite administrateur atteinte (20 scans). Prochain scan demain.',
  },
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

    const { scanType, checkOnly }: ScanCheckRequest = await req.json();

    if (
      !scanType ||
      !['body', 'health', 'nutrition', 'super'].includes(scanType)
    ) {
      throw new Error('Invalid scan type');
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('account_tier, scan_usage, welcome_credits')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('Failed to fetch user profile');
    }

    const accountTier = profile.account_tier as 'free' | 'premium' | 'admin';
    const scanUsage: ScanUsage = profile.scan_usage || {
      health: { last_scan_date: null, scan_timestamps: [] },
      body: { last_scan_date: null, scan_timestamps: [] },
      nutrition: { last_scan_date: null, scan_timestamps: [] },
      super: { last_scan_date: null, scan_timestamps: [] },
    };
    const welcomeCredits: WelcomeCredits = profile.welcome_credits || {
      health: 0,
      body: 0,
      nutrition: 0,
    };

    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    // Gestion spéciale pour Super Scan - Premium/Admin only
    if (scanType === 'super' && accountTier === 'free') {
      return new Response(
        JSON.stringify({
          success: true,
          allowed: false,
          message: SCAN_MESSAGES.free.super,
          current_count: 0,
          limit: 0,
          welcome_credits: 0,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Si l'utilisateur a des credits de bienvenue pour ce type de scan (pas applicable pour super)
    if (scanType !== 'super' && welcomeCredits[scanType] > 0) {
      // Si c'est juste une verification, retourner sans consommer le credit
      if (checkOnly) {
        return new Response(
          JSON.stringify({
            success: true,
            allowed: true,
            message: 'Credit de bienvenue disponible',
            welcome_credits: welcomeCredits[scanType],
            current_count: 0,
            limit: SCAN_LIMITS[accountTier][scanType].count,
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          },
        );
      }

      // Consommer le credit de bienvenue ET enregistrer dans scan_usage
      const updatedWelcomeCredits = {
        ...welcomeCredits,
        [scanType]: welcomeCredits[scanType] - 1,
      };

      // Aussi mettre a jour scan_usage pour que le current_count soit correct
      const limit = SCAN_LIMITS[accountTier][scanType];
      const cutoffTime = now - limit.periodMs;
      const record = scanUsage[scanType] || { last_scan_date: null, scan_timestamps: [] };
      const validTimestamps = (record.scan_timestamps || []).filter(
        (ts: string) => new Date(ts).getTime() > cutoffTime,
      );
      validTimestamps.push(nowIso);

      const updatedScanUsage = {
        ...scanUsage,
        [scanType]: {
          last_scan_date: nowIso,
          scan_timestamps: validTimestamps.slice(-limit.count),
        },
      };

      const { error: updateCreditsError } = await supabaseClient
        .from('user_profiles')
        .update({
          welcome_credits: updatedWelcomeCredits,
          scan_usage: updatedScanUsage,
        })
        .eq('id', user.id);

      if (updateCreditsError) {
        throw updateCreditsError;
      }

      const { data: scanRecord, error: scanError } = await supabaseClient
        .from('scans')
        .insert({
          user_id: user.id,
          scan_type: scanType,
          created_at: nowIso,
        })
        .select('id')
        .single();

      if (scanError) {
        console.error('Error creating scan record:', scanError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          allowed: true,
          message: 'Scan autorise (credit de bienvenue utilise)',
          used_welcome_credit: true,
          remaining_welcome_credits: updatedWelcomeCredits[scanType],
          welcome_credits: updatedWelcomeCredits[scanType],
          current_count: validTimestamps.length,
          limit: limit.count,
          scan_id: scanRecord?.id || null,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const limit = SCAN_LIMITS[accountTier][scanType];
    const cutoffTime = now - limit.periodMs;

    const record = scanUsage[scanType] || { last_scan_date: null, scan_timestamps: [] };
    const validTimestamps = (record.scan_timestamps || []).filter(
      (ts: string) => new Date(ts).getTime() > cutoffTime,
    );

    // Limite atteinte
    if (validTimestamps.length >= limit.count) {
      const sortedTimestamps = validTimestamps.sort(
        (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime(),
      );
      const oldestTimestamp = sortedTimestamps[0];
      const nextAvailableDate =
        new Date(oldestTimestamp).getTime() + limit.periodMs;

      return new Response(
        JSON.stringify({
          success: true,
          allowed: false,
          message:
            SCAN_MESSAGES[accountTier]?.[scanType] ||
            SCAN_MESSAGES.free[scanType],
          next_available_date: nextAvailableDate,
          current_count: validTimestamps.length,
          limit: limit.count,
          welcome_credits: scanType === 'super' ? 0 : welcomeCredits[scanType],
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Si c'est juste une verification, retourner sans enregistrer
    if (checkOnly) {
      return new Response(
        JSON.stringify({
          success: true,
          allowed: true,
          message: 'Scan disponible',
          current_count: validTimestamps.length,
          limit: limit.count,
          welcome_credits: scanType === 'super' ? 0 : welcomeCredits[scanType],
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Enregistrer le scan
    validTimestamps.push(nowIso);

    const updatedScanUsage = {
      ...scanUsage,
      [scanType]: {
        last_scan_date: nowIso,
        scan_timestamps: validTimestamps.slice(-limit.count),
      },
    };

    const { error: updateError } = await supabaseClient
      .from('user_profiles')
      .update({ scan_usage: updatedScanUsage })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    const { data: scanRecord, error: scanError } = await supabaseClient
      .from('scans')
      .insert({
        user_id: user.id,
        scan_type: scanType,
        created_at: nowIso,
      })
      .select('id')
      .single();

    if (scanError) {
      console.error('Error creating scan record:', scanError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        allowed: true,
        message: 'Scan autorisé',
        current_count: validTimestamps.length,
        limit: limit.count,
        welcome_credits: scanType === 'super' ? 0 : welcomeCredits[scanType],
        scan_id: scanRecord?.id || null,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error checking scan eligibility:', error);
    return new Response(
      JSON.stringify({
        success: false,
        allowed: false,
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

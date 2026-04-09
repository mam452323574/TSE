import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { getSupabaseServerConfig, requireServerEnv } from './phase2Env.ts';
import { Phase2HttpError } from './phase2Errors.ts';

export function createServiceRoleClient() {
  const { supabaseUrl, serviceRoleKey } = getSupabaseServerConfig();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseUrlOrThrow() {
  return requireServerEnv('SUPABASE_URL', {
    code: 'missing_supabase_url',
    message: 'SUPABASE_URL is not configured',
  });
}

export async function requireAuthenticatedUser(client: any, req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Phase2HttpError(401, 'missing_authorization', 'Missing authorization header');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    throw new Phase2HttpError(401, 'invalid_authorization', 'Invalid authorization header');
  }

  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);

  if (error || !user) {
    throw new Phase2HttpError(401, 'invalid_authentication', 'Invalid authentication');
  }

  return user;
}

export async function requireAdminUserProfile(client: any, userId: string) {
  const { data: profile, error } = await client
    .from('user_profiles')
    .select('id, account_tier')
    .eq('id', userId)
    .maybeSingle();

  if (error || !profile) {
    throw new Phase2HttpError(403, 'admin_profile_missing', 'Admin profile not found');
  }

  if (profile.account_tier !== 'admin') {
    throw new Phase2HttpError(403, 'admin_required', 'Admin access is required');
  }

  return profile;
}

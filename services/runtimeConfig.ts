import Constants from 'expo-constants';

type RuntimeConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  revenueCatIosApiKey: string | null;
  revenueCatAndroidApiKey: string | null;
  aptabaseAppKey: string | null;
  aptabaseHost: string | null;
};

type PublicConfigKey =
  | 'EXPO_PUBLIC_SUPABASE_URL'
  | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  | 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY'
  | 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY'
  | 'EXPO_PUBLIC_APTABASE_APP_KEY'
  | 'EXPO_PUBLIC_APTABASE_HOST';

function readExpoExtraValue(key: PublicConfigKey) {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const value = extra?.[key];

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readPublicConfigValue(key: PublicConfigKey) {
  const expoValue = readExpoExtraValue(key);
  if (expoValue) {
    return expoValue;
  }

  const processValue = process.env[key];
  return typeof processValue === 'string' && processValue.trim().length > 0
    ? processValue.trim()
    : null;
}

function requirePublicConfigValue(key: PublicConfigKey) {
  const value = readPublicConfigValue(key);
  if (!value) {
    throw new Error(`Missing required public config: ${key}`);
  }

  return value;
}

let runtimeConfigCache: RuntimeConfig | null = null;

export function getRuntimeConfig(): RuntimeConfig {
  if (runtimeConfigCache) {
    return runtimeConfigCache;
  }

  runtimeConfigCache = {
    supabaseUrl: requirePublicConfigValue('EXPO_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: requirePublicConfigValue('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    revenueCatIosApiKey: readPublicConfigValue('EXPO_PUBLIC_REVENUECAT_IOS_API_KEY'),
    revenueCatAndroidApiKey: readPublicConfigValue('EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY'),
    aptabaseAppKey: readPublicConfigValue('EXPO_PUBLIC_APTABASE_APP_KEY'),
    aptabaseHost: readPublicConfigValue('EXPO_PUBLIC_APTABASE_HOST'),
  };

  return runtimeConfigCache;
}

export function getSupabaseFunctionUrl(functionName: string) {
  return `${getRuntimeConfig().supabaseUrl.replace(/\/+$/, '')}/functions/v1/${functionName}`;
}

export function resetRuntimeConfigForTests() {
  runtimeConfigCache = null;
}

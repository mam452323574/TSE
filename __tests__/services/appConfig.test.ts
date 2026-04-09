import {
  APP_CONFIG_REMOTE_KEY,
  DEFAULT_APP_CONFIG,
  DEFAULT_FEATURE_FLAGS,
  fetchAppConfig,
  parseAppConfigValue,
} from '@/services/appConfig';

const mockCanonicalMaybeSingle = jest.fn();
const mockCompatibilityMaybeSingle = jest.fn();
const mockCanonicalEq = jest.fn(() => ({
  maybeSingle: mockCanonicalMaybeSingle,
}));
const mockCompatibilityEq = jest.fn(() => ({
  maybeSingle: mockCompatibilityMaybeSingle,
}));
const mockCanonicalSelect = jest.fn(() => ({
  eq: mockCanonicalEq,
}));
const mockCompatibilitySelect = jest.fn(() => ({
  eq: mockCompatibilityEq,
}));
const mockFrom = jest.fn((table: string) => {
  if (table === 'app_feature_flags') {
    return {
      select: mockCanonicalSelect,
    };
  }

  if (table === 'app_config') {
    return {
      select: mockCompatibilitySelect,
    };
  }

  throw new Error(`Unexpected table requested in appConfig test: ${table}`);
});

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

describe('appConfig service', () => {
  const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });

  it('parses supported fields and keeps unknown payload values safe', () => {
    expect(
      parseAppConfigValue({
        social_enabled: true,
        coach_enabled: true,
        entry_offer_enabled: false,
        social_comments_enabled: true,
        entry_offer_offering_id: 'welcome_offer',
        post_rate_limit_per_day: 5,
        comment_rate_limit_per_hour: 10,
        rollout_percentage: 25,
        moderation_enabled: true,
        report_rate_limit_per_day: 12,
        repeated_rejection_threshold: 4,
        rejected_content_cooldown_hours: 48,
        coach_cache_ttl_minutes: 1440,
        ignored_key: 'ignored',
      }),
    ).toEqual({
      social_enabled: true,
      coach_enabled: true,
      entry_offer_enabled: false,
      social_comments_enabled: true,
      entry_offer_offering_id: 'welcome_offer',
      post_rate_limit_per_day: 5,
      comment_rate_limit_per_hour: 10,
      rollout_percentage: 25,
      moderation_enabled: true,
    });
  });

  it('falls back to defaults for malformed payloads', () => {
    expect(
      parseAppConfigValue({
        social_enabled: 'yes',
        coach_enabled: 1,
        entry_offer_enabled: null,
        social_comments_enabled: 'no',
        entry_offer_offering_id: 42,
        post_rate_limit_per_day: 'daily',
        comment_rate_limit_per_hour: {},
        rollout_percentage: [],
        moderation_enabled: 'sure',
      }),
    ).toEqual(DEFAULT_APP_CONFIG);
    expect(parseAppConfigValue(null)).toEqual(DEFAULT_APP_CONFIG);
    expect(DEFAULT_FEATURE_FLAGS).toEqual({
      social_enabled: false,
      coach_enabled: false,
      entry_offer_enabled: false,
      social_comments_enabled: false,
    });
  });

  it('prefers the canonical app_feature_flags row when it is available', async () => {
    mockCanonicalMaybeSingle.mockResolvedValue({
      data: {
        social_enabled: true,
        moderation_enabled: true,
      },
      error: null,
    });

    await expect(fetchAppConfig()).resolves.toEqual({
      ...DEFAULT_APP_CONFIG,
      social_enabled: true,
      moderation_enabled: true,
    });

    expect(mockFrom).toHaveBeenCalledWith('app_feature_flags');
    expect(mockCanonicalSelect).toHaveBeenCalledWith(
      'social_enabled, coach_enabled, entry_offer_enabled, social_comments_enabled, entry_offer_offering_id, post_rate_limit_per_day, comment_rate_limit_per_hour, rollout_percentage, moderation_enabled',
    );
    expect(mockCanonicalEq).toHaveBeenCalledWith('scope', APP_CONFIG_REMOTE_KEY);
    expect(mockCompatibilitySelect).not.toHaveBeenCalled();
  });

  it('falls back to the app_config compatibility view when app_feature_flags is unavailable', async () => {
    mockCanonicalMaybeSingle.mockResolvedValue({
      data: null,
      error: {
        code: '42P01',
        message: 'relation "app_feature_flags" does not exist',
      },
    });
    mockCompatibilityMaybeSingle.mockResolvedValue({
      data: {
        value: {
          coach_enabled: true,
          social_comments_enabled: true,
        },
      },
      error: null,
    });

    await expect(fetchAppConfig()).resolves.toEqual({
      ...DEFAULT_APP_CONFIG,
      coach_enabled: true,
      social_comments_enabled: true,
    });

    expect(mockFrom).toHaveBeenCalledWith('app_config');
    expect(mockCompatibilitySelect).toHaveBeenCalledWith('value');
    expect(mockCompatibilityEq).toHaveBeenCalledWith('key', APP_CONFIG_REMOTE_KEY);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('returns defaults when the canonical row is missing or both sources are unavailable', async () => {
    mockCanonicalMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(fetchAppConfig()).resolves.toEqual(DEFAULT_APP_CONFIG);
    expect(mockCompatibilitySelect).not.toHaveBeenCalled();

    jest.clearAllMocks();

    mockCanonicalMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: {
        code: '42P01',
        message: 'relation "app_feature_flags" does not exist',
      },
    });
    mockCompatibilityMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { code: '42P01', message: 'relation "app_config" does not exist' },
    });

    await expect(fetchAppConfig()).resolves.toEqual(DEFAULT_APP_CONFIG);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});

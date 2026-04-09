import {
  buildCoachPayload,
  fetchCoachEntries,
  fetchRecentCoachScans,
  generateCoachGuidance,
} from '@/services/coach';
import { DEFAULT_COACH_PERSONA_KEY } from '@/shared/coachPersonas';

const { supabase } = jest.requireMock('@/services/supabase') as {
  supabase: {
    from: jest.Mock;
    auth: {
      getSession: jest.Mock;
    };
  };
};

describe('coach service', () => {
  const originalFetch = global.fetch;
  const originalSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-123',
        },
      },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.EXPO_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  });

  function createScansSelectMock(data: unknown[]) {
    return {
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({
              data,
              error: null,
            }),
          })),
        })),
      })),
    };
  }

  function createLatestEntrySelectMock(
    data: unknown,
    onEq: jest.Mock = jest.fn(),
    error: unknown = null,
  ) {
    return {
      select: jest.fn(() => ({
        eq: jest.fn((field: string, value: unknown) => {
          onEq(field, value);
          return {
            eq: jest.fn((nextField: string, nextValue: unknown) => {
              onEq(nextField, nextValue);
              return {
                order: jest.fn(() => ({
                  order: jest.fn(() => ({
                    limit: jest.fn(() => ({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data,
                        error,
                      }),
                    })),
                  })),
                })),
              };
            }),
          };
        }),
      })),
    };
  }

  const recentScans = [
    {
      id: 'scan-face',
      scan_type: 'health',
      created_at: '2026-04-06T10:00:00.000Z',
      analyzed_at: '2026-04-06T10:05:00.000Z',
      analysis_result: {
        schema_version: 3,
        scan_type: 'face',
        face_score: 87,
        perceived_age: 28,
        skin_quality_score: 80,
        symmetry_percentage: 88,
        fatigue_level: 22,
        glow_index: 61,
        energy_score: 73,
        face_shape_key: 'oval',
        collagen_level: 64,
        hydration_level: 70,
        photogenic_score: 86,
      },
    },
  ];

  it('builds a guided coach payload with the right prompt-specific scan selection', () => {
    const payload = buildCoachPayload('nutrition_focus', [
      {
        id: 'scan-body',
        scan_type: 'body',
        captured_at: '2026-04-06T09:00:00.000Z',
        digest: {
          scan_id: 'scan-body',
          scan_type: 'body',
          captured_at: '2026-04-06T09:00:00.000Z',
          normalized_scan_type: 'body',
          metrics: { body_score: 81 },
        },
      },
      {
        id: 'scan-food',
        scan_type: 'nutrition',
        captured_at: '2026-04-06T10:00:00.000Z',
        digest: {
          scan_id: 'scan-food',
          scan_type: 'nutrition',
          captured_at: '2026-04-06T10:00:00.000Z',
          normalized_scan_type: 'nutrition',
          metrics: { plate_health_score: 91 },
        },
      },
    ] as any);

    expect(payload.prompt_type).toBe('nutrition_focus');
    expect(payload.selected_scan?.scan_id).toBe('scan-food');
    expect(payload.recent_scans).toHaveLength(2);
  });

  it('reuses a cached server response and sends the selected persona key', async () => {
    supabase.from.mockImplementation((table: string) => {
      if (table === 'scans') {
        return createScansSelectMock(recentScans);
      }

      return createLatestEntrySelectMock(null);
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          success: true,
          cached: true,
          entry_id: 'entry-1',
          persona_key: 'patient_calm',
          status: 'ready',
          title: 'Coach guidance',
          body: 'Stay hydrated and keep your current routine steady.',
          disclaimer:
            'Wellness guidance only. This is not a diagnosis or medical advice.',
          cta_label: null,
          cta_route: null,
          source: 'n8n',
          expires_at: '2026-04-06T12:00:00.000Z',
          response_payload_json: { cached: true },
        }),
    }) as typeof global.fetch;

    const result = await generateCoachGuidance({
      promptType: 'latest_scan',
      locale: 'en',
      personaKey: 'patient_calm',
    });

    expect(result.cached).toBe(true);
    expect(result.fallback).toBe(false);
    expect(result.persona_key).toBe('patient_calm');
    expect(result.disclaimer).toContain('not a diagnosis');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/coach-generate-response'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      }),
    );

    const requestBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body as string,
    );
    expect(requestBody.persona_key).toBe('patient_calm');
  });

  it('falls back to the default persona when no valid persona is selected', async () => {
    supabase.from.mockImplementation((table: string) => {
      if (table === 'scans') {
        return createScansSelectMock(recentScans);
      }

      return createLatestEntrySelectMock(null);
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          success: true,
          cached: false,
          entry_id: 'entry-default',
          status: 'ready',
          title: 'Default coach guidance',
          body: 'Keep the basics steady this week.',
          disclaimer:
            'Wellness guidance only. This is not a diagnosis or medical advice.',
          cta_label: null,
          cta_route: null,
          source: 'n8n',
          expires_at: null,
          response_payload_json: {},
        }),
    }) as typeof global.fetch;

    const result = await generateCoachGuidance({
      promptType: 'latest_scan',
      locale: 'en',
      personaKey: 'not_a_real_persona' as any,
    });

    const requestBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body as string,
    );

    expect(requestBody.persona_key).toBe(DEFAULT_COACH_PERSONA_KEY);
    expect(result.persona_key).toBe(DEFAULT_COACH_PERSONA_KEY);
  });

  it('falls back to the latest ready guidance for the same persona when generation fails', async () => {
    const eqCalls = jest.fn();

    supabase.from.mockImplementation((table: string) => {
      if (table === 'scans') {
        return createScansSelectMock(recentScans);
      }

      return createLatestEntrySelectMock(
        {
          id: 'entry-fallback',
          title: 'Saved guidance',
          body: 'Keep your current routine steady this week.',
          disclaimer:
            'Wellness guidance only. This is not a diagnosis or medical advice.',
          persona_key: 'strict_tough',
          created_at: '2026-04-06T09:00:00.000Z',
          status: 'ready',
          cta_label: null,
          cta_route: null,
          source: 'n8n',
          response_payload_json: {},
        },
        eqCalls,
      );
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => JSON.stringify({ error: 'n8n unavailable' }),
    }) as typeof global.fetch;

    const result = await generateCoachGuidance({
      promptType: 'latest_scan',
      locale: 'en',
      personaKey: 'strict_tough',
    });

    expect(result.fallback).toBe(true);
    expect(result.title).toBe('Saved guidance');
    expect(result.persona_key).toBe('strict_tough');
    expect(eqCalls).toHaveBeenCalledWith('status', 'ready');
    expect(eqCalls).toHaveBeenCalledWith('persona_key', 'strict_tough');
  });

  it('surfaces a precise coach entries error instead of returning an empty state', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: '42P01',
                message: 'relation "coach_entries" does not exist',
              },
            }),
          })),
        })),
      })),
    });

    await expect(fetchCoachEntries()).rejects.toMatchObject({
      code: 'coach_entries_unavailable',
      status: 503,
      message: expect.stringContaining('coach_entries'),
    });
  });

  it('surfaces a precise coach entries policy denial instead of a generic read error', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: '42501',
                message: 'permission denied for table coach_entries',
              },
            }),
          })),
        })),
      })),
    });

    await expect(fetchCoachEntries()).rejects.toMatchObject({
      code: 'coach_entries_policy_denied',
      status: 403,
      message: expect.stringContaining('denied'),
    });
  });

  it('surfaces a precise recent scans error instead of returning an empty array', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: '42P01',
                message: 'relation "scans" does not exist',
              },
            }),
          })),
        })),
      })),
    });

    await expect(fetchRecentCoachScans()).rejects.toMatchObject({
      code: 'coach_scans_unavailable',
      status: 503,
      message: expect.stringContaining('scans'),
    });
  });

  it('surfaces a precise recent scans schema mismatch instead of a generic read error', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: '42703',
                message: 'column "analysis_result" does not exist',
              },
            }),
          })),
        })),
      })),
    });

    await expect(fetchRecentCoachScans()).rejects.toMatchObject({
      code: 'coach_scans_schema_mismatch',
      status: 503,
      message: expect.stringContaining('missing required columns'),
    });
  });

  it('surfaces locked persona rejection when no fallback entry is available', async () => {
    supabase.from.mockImplementation((table: string) => {
      if (table === 'scans') {
        return createScansSelectMock(recentScans);
      }

      return createLatestEntrySelectMock(null);
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () =>
        JSON.stringify({
          error: 'Coach persona requires premium',
          code: 'coach_persona_requires_premium',
        }),
    }) as typeof global.fetch;

    await expect(
      generateCoachGuidance({
        promptType: 'latest_scan',
        locale: 'en',
        personaKey: 'strict_tough',
      }),
    ).rejects.toMatchObject({
      code: 'coach_persona_requires_premium',
      status: 403,
    });
  });

  it('surfaces a missing coach webhook env when generation cannot be configured server-side', async () => {
    supabase.from.mockImplementation((table: string) => {
      if (table === 'scans') {
        return createScansSelectMock(recentScans);
      }

      return createLatestEntrySelectMock({
        id: 'entry-fallback',
        title: 'Saved guidance',
        body: 'This should not mask a missing env.',
        disclaimer:
          'Wellness guidance only. This is not a diagnosis or medical advice.',
        persona_key: 'patient_calm',
        created_at: '2026-04-06T09:00:00.000Z',
        status: 'ready',
        cta_label: null,
        cta_route: null,
        source: 'n8n',
        response_payload_json: {},
      });
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () =>
        JSON.stringify({
          error: 'Coach generation provider is not configured',
          code: 'coach_webhook_not_configured',
        }),
    }) as typeof global.fetch;

    await expect(
      generateCoachGuidance({
        promptType: 'latest_scan',
        locale: 'en',
        personaKey: 'patient_calm',
      }),
    ).rejects.toMatchObject({
      code: 'coach_webhook_not_configured',
      status: 503,
    });
  });

  it('preserves fallback lookup parity errors instead of swallowing them behind stale guidance', async () => {
    supabase.from.mockImplementation((table: string) => {
      if (table === 'scans') {
        return createScansSelectMock(recentScans);
      }

      return createLatestEntrySelectMock(
        null,
        jest.fn(),
        {
          code: '42703',
          message: 'column "persona_key" does not exist',
        },
      );
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => JSON.stringify({ error: 'n8n unavailable' }),
    }) as typeof global.fetch;

    await expect(
      generateCoachGuidance({
        promptType: 'latest_scan',
        locale: 'en',
        personaKey: 'patient_calm',
      }),
    ).rejects.toMatchObject({
      code: 'coach_entries_schema_mismatch',
      status: 503,
    });
  });

  it('names the missing Coach generation route when the function is not deployed', async () => {
    supabase.from.mockImplementation((table: string) => {
      if (table === 'scans') {
        return createScansSelectMock(recentScans);
      }

      return createLatestEntrySelectMock(null);
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => '',
    }) as typeof global.fetch;

    await expect(
      generateCoachGuidance({
        promptType: 'latest_scan',
        locale: 'en',
        personaKey: 'patient_calm',
      }),
    ).rejects.toMatchObject({
      code: 'edge_function_route_missing',
      status: 404,
      functionName: 'coach-generate-response',
      message: expect.stringContaining('coach-generate-response'),
    });
  });
});

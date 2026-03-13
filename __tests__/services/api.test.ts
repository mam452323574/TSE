import { ApiService } from '@/services/api';

// Mock expo-file-system/next
const mockBase64 = jest.fn();
jest.mock('expo-file-system/next', () => ({
  File: jest.fn().mockImplementation((uri: string) => ({
    uri,
    base64: () => mockBase64(),
  })),
}));

// Mock base64-arraybuffer
const mockDecode = jest.fn().mockReturnValue(new ArrayBuffer(100));
jest.mock('base64-arraybuffer', () => ({
  decode: (...args: any[]) => mockDecode(...args),
}));

// Mock supabase
const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockFrom = jest.fn();
const mockStorageUpload = jest.fn().mockResolvedValue({ error: null });
const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
  data: { publicUrl: 'https://example.com/image.jpg' },
});
const mockStorageCreateSignedUrl = jest.fn().mockResolvedValue({
  data: { signedUrl: 'https://example.com/signed-image.jpg' },
  error: null,
});
const mockStorageFrom = jest.fn().mockReturnValue({
  upload: mockStorageUpload,
  getPublicUrl: mockStorageGetPublicUrl,
  createSignedUrl: mockStorageCreateSignedUrl,
});

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
      getSession: () => mockGetSession(),
    },
    from: (table: string) => mockFrom(table),
    storage: {
      from: (bucket: string) => mockStorageFrom(bucket),
    },
  },
}));

// Mock N8nWebhookService
const mockAnalyzeScan = jest.fn();
jest.mock('@/services/n8nWebhook', () => ({
  N8nWebhookService: {
    analyzeScan: (...args: any[]) => mockAnalyzeScan(...args),
  },
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    },
  },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageUpload.mockResolvedValue({ error: null });
    mockStorageGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/image.jpg' },
    });
  });

  describe('getDashboard', () => {
    it('returns dashboard data for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });

      // Mock health_scores query
      const mockHealthScore = {
        score: 85,
        calories_current: 1500,
        calories_goal: 2000,
        bodyfat: 18,
      };

      // Mock recommended_products query
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          image_url: 'https://example.com/1.jpg',
          benefits: ['Benefit A'],
          shop_url: 'https://shop.com/1',
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_current_global_score') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { global_score: 85 },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'health_scores') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              }),
            }),
          };
        }
        if (table === 'recommended_products') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: mockProducts,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await ApiService.getDashboard();

      expect(result.healthScore).toBe(85);
      expect(result.calories.current).toBe(0);
      expect(result.calories.goal).toBe(2000);
      expect(result.bodyfat).toBe(0);
      expect(result.recommendedProducts).toHaveLength(1);
      expect(result.recommendedProducts[0].name).toBe('Product 1');
    });

    it('throws error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(ApiService.getDashboard()).rejects.toThrow('api_errors.unauthorized');
    });

    it('returns default values when no health score exists', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_current_global_score') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'recommended_products') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await ApiService.getDashboard();

      expect(result.healthScore).toBe(0);
      expect(result.calories.current).toBe(0);
      expect(result.calories.goal).toBe(2000);
      expect(result.bodyfat).toBe(0);
    });

    it('throws error on database error', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_current_global_score') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { global_score: 85 },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'recommended_products') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(ApiService.getDashboard()).rejects.toEqual({ message: 'Database error' });
    });
  });

  describe('getAnalytics', () => {
    const mockUser = { id: 'user-123' };
    const mockHealthScores = [
      { date: '2024-01-01', score: 80, calories_current: 1800, calories_goal: 2000, bodyfat: 20, muscle: 40 },
      { date: '2024-01-02', score: 82, calories_current: 1900, calories_goal: 2000, bodyfat: 19, muscle: 41 },
    ];

    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    });

    it('returns analytics for 7 days period', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'health_scores') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: mockHealthScores,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'scan_metrics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: [
                        { recorded_at: '2024-01-01', scan_type: 'face', face_score: 80, skin_quality_score: 85 },
                        { recorded_at: '2024-01-01', scan_type: 'body', body_score: 80, body_fat_percentage: 20 },
                        { recorded_at: '2024-01-02', scan_type: 'face', face_score: 82, skin_quality_score: 86 },
                        { recorded_at: '2024-01-02', scan_type: 'body', body_score: 82, body_fat_percentage: 19 },
                        { recorded_at: '2024-01-03', scan_type: 'nutrition', plate_health_score: 85, calories_estimate: 600, protein_grams: 25 },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await ApiService.getAnalytics('7days');

      expect(result.period).toBe('7days');
      expect(result.healthScoreHistory).toHaveLength(2);
      expect(result.calorieHistory).toHaveLength(2);
      expect(result.bodyCompositionHistory).toHaveLength(2);
      expect(result.nutritionHistory).toHaveLength(1);
      expect(result.nutritionHistory[0].nutritionScore).toBe(85);
    });

    it('returns analytics for 30 days period', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'health_scores') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: mockHealthScores,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'scan_metrics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await ApiService.getAnalytics('30days');

      expect(result.period).toBe('30days');
    });

    it('returns empty arrays when no data', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'health_scores' || table === 'scan_metrics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await ApiService.getAnalytics('7days');

      expect(result.healthScoreHistory).toHaveLength(0);
      expect(result.calorieHistory).toHaveLength(0);
      expect(result.bodyCompositionHistory).toHaveLength(0);
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(ApiService.getAnalytics('7days')).rejects.toThrow('api_errors.unauthorized');
    });
  });

  describe('getRecipes', () => {
    it('returns recipes list', async () => {
      const mockRecipes = [{ id: 1, name: 'Recipe 1' }, { id: 2, name: 'Recipe 2' }];

      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockRecipes,
            error: null,
          }),
        }),
      }));

      const result = await ApiService.getRecipes();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Recipe 1');
    });

    it('returns empty array when no recipes', async () => {
      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }));

      const result = await ApiService.getRecipes();

      expect(result).toHaveLength(0);
    });
  });

  describe('getExercises', () => {
    it('returns exercises list', async () => {
      const mockExercises = [{ id: 1, name: 'Exercise 1' }];

      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockExercises,
            error: null,
          }),
        }),
      }));

      const result = await ApiService.getExercises();

      expect(result).toHaveLength(1);
    });
  });

  describe('checkScanEligibility', () => {
    it('returns eligibility response when allowed', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      });

      const mockResponse = {
        success: true,
        allowed: true,
        message: 'Scan allowed',
        current_count: 1,
        limit: 3,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await ApiService.checkScanEligibility('health');

      expect(result.allowed).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/check-and-record-scan'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ scanType: 'health' }),
        })
      );
    });

    it('throws error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      await expect(ApiService.checkScanEligibility('health')).rejects.toThrow('api_errors.unauthorized');
    });

    it('throws error on HTTP error', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      });

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Limit exceeded' }),
      });

      await expect(ApiService.checkScanEligibility('health')).rejects.toThrow('Limit exceeded');
    });
  });

  describe('checkScanEligibilityOnly', () => {
    it('sends checkOnly flag', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ allowed: true }),
      });

      await ApiService.checkScanEligibilityOnly('body');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ scanType: 'body', checkOnly: true }),
        })
      );
    });
  });

  describe('getNextAvailableScanDate', () => {
    it('returns next available date', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      });

      const nextDate = Date.now() + 86400000;
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ next_available_date: nextDate }),
      });

      const result = await ApiService.getNextAvailableScanDate('nutrition');

      expect(result).toBe(nextDate);
    });

    it('returns null on error', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      const result = await ApiService.getNextAvailableScanDate('health');

      expect(result).toBeNull();
    });

    it('returns null when no next_available_date', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await ApiService.getNextAvailableScanDate('health');

      expect(result).toBeNull();
    });
  });

  describe('analyzeScanWithN8n', () => {
    const mockUser = { id: 'user-123' };

    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    });

    it('analyzes scan and updates database', async () => {
      const mockAnalysisResult = {
        success: true,
        data: { scan_type: 'nutrition', plate_health_score: 90, recommendations: ['Eat more vegetables'] },
      };
      mockAnalyzeScan.mockResolvedValue(mockAnalysisResult);

      const mockUpdatedScan = { id: 'scan-123', analysis_result: mockAnalysisResult.data };
      mockFrom.mockImplementation(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedScan,
                error: null,
              }),
            }),
          }),
        }),
      }));

      const result = await ApiService.analyzeScanWithN8n('scan-123', 'data:image/jpeg;base64,abc123', 'nutrition', 'fr');

      expect(mockAnalyzeScan).toHaveBeenCalledWith('data:image/jpeg;base64,abc123', 'user-123', 'nutrition', 'fr');
      expect(result).toEqual(mockUpdatedScan);
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(
        ApiService.analyzeScanWithN8n('scan-123', 'data:image/jpeg;base64,abc123', 'health', 'fr')
      ).rejects.toThrow('api_errors.unauthorized');
    });

    it('throws error when analysis fails', async () => {
      mockAnalyzeScan.mockResolvedValue({
        success: false,
        error: 'Analysis service unavailable',
      });

      await expect(
        ApiService.analyzeScanWithN8n('scan-123', 'data:image/jpeg;base64,abc123', 'body', 'fr')
      ).rejects.toThrow('Analysis service unavailable');
    });

    it('throws error when analysis returns no data', async () => {
      mockAnalyzeScan.mockResolvedValue({
        success: true,
        data: null,
      });

      await expect(
        ApiService.analyzeScanWithN8n('scan-123', 'data:image/jpeg;base64,abc123', 'body', 'fr')
      ).rejects.toThrow();
    });
  });

  describe('createScanWithAnalysis', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      });
    });

    it('returns scan without analysis when analysis fails', async () => {
      // Mock eligibility check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ allowed: true, scan_id: 'scan-123', welcome_credits: 0 }),
      });

      const mockScan = { id: 'scan-123', image_url: 'https://example.com/image.jpg' };

      mockFrom.mockImplementation(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockScan,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }));

      const result = await ApiService.createScanWithAnalysis('file:///test.jpg', 'health', 'fr');

      // Should return the scan with analysisSucceeded: false
      expect(result.scan.id).toBe('scan-123');
      expect(result.analysisSucceeded).toBe(false);
      expect(result.analysisError).toBeDefined();
    });

    it('uploads image using ImageManipulator base64', async () => {
      // Mock eligibility check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ allowed: true, scan_id: 'scan-456', welcome_credits: 0 }),
      });

      const mockScan = { id: 'scan-456', image_url: 'https://example.com/uploaded.jpg' };

      mockFrom.mockImplementation(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockScan,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }));

      // Mock successful analysis
      mockAnalyzeScan.mockResolvedValue({
        success: true,
        data: { scan_type: 'body', body_score: 85 },
      });

      await ApiService.createScanWithAnalysis('file:///camera/photo.jpg', 'body', 'fr');

      // Verify decode called (implies ImageManipulator usage)
      expect(mockDecode).toHaveBeenCalledWith('test-base-64');
      expect(mockStorageUpload).toHaveBeenCalled();
    });
  });
});

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useScanEligibility,
  useAllScanEligibility,
  SCAN_ELIGIBILITY_QUERY_KEY
} from '@/hooks/queries/useScanEligibility';

// Mock ApiService
jest.mock('@/services/api', () => ({
  ApiService: {
    checkScanEligibilityOnly: jest.fn(),
  },
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    session: { access_token: 'test-token', user: { id: 'test-user' } },
    isLoading: false,
  }),
}));

import { ApiService } from '@/services/api';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useScanEligibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates correct query key', () => {
    expect(SCAN_ELIGIBILITY_QUERY_KEY('body')).toEqual(['scanEligibility', 'body']);
    expect(SCAN_ELIGIBILITY_QUERY_KEY('health')).toEqual(['scanEligibility', 'health']);
    expect(SCAN_ELIGIBILITY_QUERY_KEY('nutrition')).toEqual(['scanEligibility', 'nutrition']);
  });

  it('fetches scan eligibility successfully', async () => {
    const mockData = {
      canScan: true,
      remainingScans: 3,
      nextScanAt: null,
    };
    (ApiService.checkScanEligibilityOnly as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useScanEligibility('body'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(ApiService.checkScanEligibilityOnly).toHaveBeenCalledWith('body');
  });

  it('handles error state', async () => {
    (ApiService.checkScanEligibilityOnly as jest.Mock).mockRejectedValue(
      new Error('Eligibility check failed')
    );

    const { result } = renderHook(() => useScanEligibility('health'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Eligibility check failed');
  });

  it('fetches for different scan types', async () => {
    const mockData = { canScan: true, remainingScans: 5 };
    (ApiService.checkScanEligibilityOnly as jest.Mock).mockResolvedValue(mockData);

    const scanTypes = ['body', 'health', 'nutrition'] as const;

    for (const scanType of scanTypes) {
      const { result } = renderHook(() => useScanEligibility(scanType), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(ApiService.checkScanEligibilityOnly).toHaveBeenCalledWith(scanType);
    }
  });
});

describe('useAllScanEligibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches eligibility for all scan types', async () => {
    const mockData = {
      canScan: true,
      remainingScans: 3,
      nextScanAt: null,
    };
    (ApiService.checkScanEligibilityOnly as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useAllScanEligibility(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have called for all scan types
    expect(ApiService.checkScanEligibilityOnly).toHaveBeenCalledTimes(4);
  });

  it('returns loading state initially', () => {
    (ApiService.checkScanEligibilityOnly as jest.Mock).mockImplementation(
      () => new Promise(() => { })
    );

    const { result } = renderHook(() => useAllScanEligibility(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('provides refetchAll function', async () => {
    const mockData = { canScan: true, remainingScans: 3 };
    (ApiService.checkScanEligibilityOnly as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useAllScanEligibility(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetchAll).toBe('function');
  });
});

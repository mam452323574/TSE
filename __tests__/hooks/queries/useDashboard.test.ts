import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDashboard, DASHBOARD_QUERY_KEY } from '@/hooks/queries/useDashboard';

// Mock ApiService
jest.mock('@/services/api', () => ({
  ApiService: {
    getDashboard: jest.fn(),
  },
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

describe('useDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct query key', () => {
    expect(DASHBOARD_QUERY_KEY).toEqual(['dashboard']);
  });

  it('fetches dashboard data successfully', async () => {
    const mockData = {
      user: { name: 'Test User' },
      stats: { totalScans: 10 },
      recentScans: [],
    };
    (ApiService.getDashboard as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(ApiService.getDashboard).toHaveBeenCalled();
  });

  it('handles loading state', () => {
    (ApiService.getDashboard as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('handles error state', async () => {
    (ApiService.getDashboard as jest.Mock).mockRejectedValue(
      new Error('Dashboard fetch failed')
    );

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Dashboard fetch failed');
  });
});

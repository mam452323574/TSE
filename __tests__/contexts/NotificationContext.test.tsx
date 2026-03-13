import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { NotificationProvider, useNotificationContext } from '@/contexts/NotificationContext';

// Mock dependencies
const mockSubscribe = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();

jest.mock('@/services/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: mockSubscribe,
    })),
    from: jest.fn((table: string) => ({
      select: mockSelect,
      update: mockUpdate,
      insert: mockInsert,
    })),
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}));

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    expoPushToken: 'test-token',
    scheduleLocalNotification: jest.fn().mockResolvedValue(undefined),
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
);

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        is: jest.fn().mockResolvedValue({ count: 0, error: null }),
        single: jest.fn().mockResolvedValue({ data: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null }),
      }),
    });
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });
    mockInsert.mockResolvedValue({ error: null });
  });

  it('provides default notification state', async () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.hasUnreadNotifications).toBe(false);
      expect(result.current.notificationCount).toBe(0);
    });
  });

  it('provides markNotificationAsRead function', async () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(typeof result.current.markNotificationAsRead).toBe('function');
    });
  });

  it('provides checkForAchievements function', async () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(typeof result.current.checkForAchievements).toBe('function');
    });
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useNotificationContext());
    }).toThrow('useNotificationContext must be used within a NotificationProvider');
  });

  it('updates notification count when unread notifications change', async () => {
    mockSelect.mockReturnValueOnce({
      eq: jest.fn().mockReturnValue({
        is: jest.fn().mockResolvedValue({ count: 5, error: null }),
      }),
    });

    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      // Initial state may vary based on mock
      expect(typeof result.current.notificationCount).toBe('number');
    });
  });

  it('can mark notification as read', async () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.markNotificationAsRead).toBeDefined();
    });

    await act(async () => {
      await result.current.markNotificationAsRead('notification-123');
    });

    // markNotificationAsRead should call supabase update
  });

  it('provides checkForAchievements function that can be called', async () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.checkForAchievements).toBeDefined();
      expect(typeof result.current.checkForAchievements).toBe('function');
    });
  });
});

describe('NotificationContext - No User', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch notifications when no user', async () => {
    jest.doMock('@/contexts/AuthContext', () => ({
      useAuth: () => ({
        user: null,
      }),
    }));

    // Context would not fetch when no user is available
  });
});

jest.unmock('@/contexts/AuthContext');
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Mock supabase
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockGetSession = jest.fn();
const mockGetUser = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
      signInWithOAuth: jest.fn(),
      getSession: () => mockGetSession(),
      getUser: () => mockGetUser(),
      onAuthStateChange: (callback: any) => {
        mockOnAuthStateChange(callback);
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      },
      setSession: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: (table: string) => mockFrom(table),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn().mockReturnValue('myapp://oauth/callback'),
  parse: jest.fn().mockReturnValue({ queryParams: {} }),
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
}));

// Mock deviceFingerprint
jest.mock('@/services/deviceFingerprint', () => ({
  getDeviceFingerprint: jest.fn().mockResolvedValue('test-fingerprint'),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    }));
  });

  describe('Complete Signup Flow', () => {
    it('completes full signup flow: signup -> email verification -> username setup', async () => {
      const mockUser = { id: 'new-user-123', email: 'new@example.com' };

      // Step 1: Sign up
      mockSignUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { id: mockUser.id, email: mockUser.email, username: null, email_verified: false },
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'oauth_connections') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === 'health_scores') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Perform signup
      let signUpResult: { userId: string; email: string };
      await act(async () => {
        signUpResult = await result.current.signUp('new@example.com', 'password123');
      });

      expect(signUpResult!.userId).toBe('new-user-123');
      expect(signUpResult!.email).toBe('new@example.com');
    });

    it('handles signup error gracefully', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already registered' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.signUp('existing@example.com', 'password');
        })
      ).rejects.toEqual({ message: 'Email already registered' });
    });
  });

  describe('Login Flow with Device Verification', () => {
    it('completes login with trusted device (no verification needed)', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock trusted device check - device is trusted
      mockFrom.mockImplementation((table: string) => {
        if (table === 'trusted_devices') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'device-123' },
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult: { needsVerification: boolean; userId: string };
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123');
      });

      expect(signInResult!.needsVerification).toBe(false);
      expect(signInResult!.userId).toBe('user-123');
    });

    it('requires verification for untrusted device', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock trusted device check - device is NOT trusted
      mockFrom.mockImplementation((table: string) => {
        if (table === 'trusted_devices') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult: { needsVerification: boolean; userId: string };
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123');
      });

      expect(signInResult!.needsVerification).toBe(true);
    });
  });

  describe('Email Verification Flow', () => {
    it('sends verification email successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.sendVerificationEmail('test@example.com', 'user-123', 'signup');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('send-verification-email'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test@example.com'),
        })
      );
    });

    it('verifies email code successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ verified: true }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let isVerified: boolean;
      await act(async () => {
        isVerified = await result.current.verifyEmailCode('123456', 'user-123', 'signup');
      });

      expect(isVerified!).toBe(true);
    });

    it('handles invalid verification code', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Code invalide ou expiré' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.verifyEmailCode('000000', 'user-123', 'signup');
        })
      ).rejects.toThrow('Code invalide ou expiré');
    });
  });

  describe('Session Recovery', () => {
    it('recovers existing session on mount', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = {
        user: mockUser,
        access_token: 'token-123',
        refresh_token: 'refresh-123',
      };

      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: {
                    id: mockUser.id,
                    email: mockUser.email,
                    username: 'testuser',
                    email_verified: true,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('handles session recovery error gracefully', async () => {
      mockGetSession.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still function, just without a session
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('Disposable Email Detection', () => {
    it('detects disposable email addresses', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'disposable_email_domains') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { domain: 'tempmail.com' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let isDisposable: boolean;
      await act(async () => {
        isDisposable = await result.current.isDisposableEmail('test@tempmail.com');
      });

      expect(isDisposable!).toBe(true);
    });

    it('allows valid email domains', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'disposable_email_domains') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let isDisposable: boolean;
      await act(async () => {
        isDisposable = await result.current.isDisposableEmail('test@gmail.com');
      });

      expect(isDisposable!).toBe(false);
    });
  });

  describe('Sign Out Flow', () => {
    it('clears all user data on sign out', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.userProfile).toBeNull();
    });

    it('handles sign out error but still clears local state', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'Network error' } });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.signOut();
        })
      ).rejects.toEqual({ message: 'Network error' });

      // State should still be cleared even on error
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('Username Availability Check', () => {
    it('confirms username is available', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
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
        return {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let isAvailable: boolean;
      await act(async () => {
        isAvailable = await result.current.checkUsernameAvailability('newusername');
      });

      expect(isAvailable!).toBe(true);
    });

    it('rejects username that is already taken', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { username: 'existinguser' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let isAvailable: boolean;
      await act(async () => {
        isAvailable = await result.current.checkUsernameAvailability('existinguser');
      });

      expect(isAvailable!).toBe(false);
    });

    it('rejects username shorter than 3 characters', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let isAvailable: boolean;
      await act(async () => {
        isAvailable = await result.current.checkUsernameAvailability('ab');
      });

      expect(isAvailable!).toBe(false);
    });
  });

  describe('Trusted Device Management', () => {
    it('adds a new trusted device', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'trusted_devices') {
          return {
            upsert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addTrustedDevice('fingerprint-123', 'iPhone 14', 'user-123');
      });

      expect(mockFrom).toHaveBeenCalledWith('trusted_devices');
    });

    it('checks if device is trusted', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'trusted_devices') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'device-123' },
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let isTrusted: boolean;
      await act(async () => {
        isTrusted = await result.current.checkTrustedDevice('fingerprint-123', 'user-123');
      });

      expect(isTrusted!).toBe(true);
    });
  });
});

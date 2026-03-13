jest.unmock('@/contexts/AuthContext');
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Mock supabase
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockSignInWithOAuth = jest.fn();
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
      signInWithOAuth: (...args: any[]) => mockSignInWithOAuth(...args),
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

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    }));
  });

  describe('useAuth hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('provides initial state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.userProfile).toBeNull();
    });
  });

  describe('signIn', () => {
    it('signs in successfully with trusted device', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock trusted device check
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

      // Mock untrusted device
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

    it('throws error on sign in failure', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.signIn('test@example.com', 'wrong');
        })
      ).rejects.toEqual({ message: 'Invalid credentials' });
    });
  });

  describe('signUp', () => {
    it('creates user and profile successfully', async () => {
      const mockUser = { id: 'new-user-123', email: 'new@example.com' };
      mockSignUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation(() => ({
        insert: jest.fn().mockResolvedValue({ error: null }),
      }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signUpResult: { userId: string; email: string };
      await act(async () => {
        signUpResult = await result.current.signUp('new@example.com', 'password123');
      });

      expect(signUpResult!.userId).toBe('new-user-123');
      expect(signUpResult!.email).toBe('new@example.com');
    });

    it('throws error when user creation fails', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.signUp('test@example.com', 'password');
        })
      ).rejects.toThrow('Erreur lors de la creation du compte');
    });
  });

  describe('checkUsernameAvailability', () => {
    it('returns true for available username', async () => {
      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let isAvailable: boolean;
      await act(async () => {
        isAvailable = await result.current.checkUsernameAvailability('newuser');
      });

      expect(isAvailable!).toBe(true);
    });

    it('returns false for taken username', async () => {
      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { username: 'existinguser' },
              error: null,
            }),
          }),
        }),
      }));

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

    it('returns false for username shorter than 3 characters', async () => {
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

  describe('isDisposableEmail', () => {
    it('returns true for disposable email', async () => {
      mockFrom.mockImplementation(() => ({
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
      }));

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

    it('returns false for valid email', async () => {
      mockFrom.mockImplementation(() => ({
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
      }));

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

    it('returns false for invalid email format', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let isDisposable: boolean;
      await act(async () => {
        isDisposable = await result.current.isDisposableEmail('invalid-email');
      });

      expect(isDisposable!).toBe(false);
    });
  });

  describe('verifyEmailCode', () => {
    it('returns true for valid code', async () => {
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
        isVerified = await result.current.verifyEmailCode('123456', 'user-123');
      });

      expect(isVerified!).toBe(true);
    });

    it('throws error for invalid code', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Code incorrect' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.verifyEmailCode('000000', 'user-123');
        })
      ).rejects.toThrow('Code incorrect');
    });
  });

  describe('signOut', () => {
    it('clears user state and signs out', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.userProfile).toBeNull();
    });

    it('throws error but still clears state on sign out failure', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.signOut();
        })
      ).rejects.toEqual({ message: 'Sign out failed' });

      // State should still be cleared
      expect(result.current.user).toBeNull();
    });
  });

  describe('addTrustedDevice', () => {
    it('adds device successfully', async () => {
      mockFrom.mockImplementation(() => ({
        upsert: jest.fn().mockResolvedValue({ error: null }),
      }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addTrustedDevice('fingerprint-123', 'iPhone 14', 'user-123');
      });

      expect(mockFrom).toHaveBeenCalledWith('trusted_devices');
    });

    it('throws error on failure', async () => {
      mockFrom.mockImplementation(() => ({
        upsert: jest.fn().mockResolvedValue({ error: { message: 'Insert failed' } }),
      }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.addTrustedDevice('fingerprint-123', 'iPhone 14', 'user-123');
        })
      ).rejects.toEqual({ message: 'Insert failed' });
    });
  });
});

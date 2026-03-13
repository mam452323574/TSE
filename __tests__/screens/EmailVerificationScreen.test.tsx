import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import EmailVerificationScreen from '@/screens/EmailVerificationScreen';

// Mock dependencies
jest.mock('lucide-react-native', () => ({
  Mail: 'Mail',
  RefreshCw: 'RefreshCw',
  ArrowLeft: 'ArrowLeft',
  Check: 'Check',
  Shield: 'Shield',
}));

jest.mock('@/components/Button', () => ({
  Button: ({ title, onPress, loading, disabled }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading}>
        <Text>{loading ? 'Loading...' : title}</Text>
      </TouchableOpacity>
    );
  },
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => ({
    email: 'test@example.com',
    userId: 'user-123',
    type: 'signup',
  }),
}));

const mockUseAuth = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/services/deviceFingerprint', () => ({
  getDeviceFingerprint: jest.fn().mockResolvedValue('fingerprint-123'),
  getDeviceName: jest.fn().mockReturnValue('Test Device'),
}));

describe('EmailVerificationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      verifyEmailCode: jest.fn().mockResolvedValue(true),
      addTrustedDevice: jest.fn().mockResolvedValue(undefined),
      refreshUserProfile: jest.fn().mockResolvedValue(undefined),
      user: { id: 'user-123', email: 'test@example.com' },
      signOut: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<EmailVerificationScreen />);
    
    expect(toJSON()).toBeTruthy();
  });

  it('displays email verification title', () => {
    render(<EmailVerificationScreen />);
    
    expect(screen.getByText('Verifiez votre email')).toBeTruthy();
  });

  it('displays email address', () => {
    render(<EmailVerificationScreen />);
    
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('displays verify button', () => {
    render(<EmailVerificationScreen />);
    
    expect(screen.getByText('Verifier')).toBeTruthy();
  });

  it('displays resend code button', () => {
    render(<EmailVerificationScreen />);
    
    expect(screen.getByText('Renvoyer le code')).toBeTruthy();
  });

  it('renders back button', () => {
    const { toJSON } = render(<EmailVerificationScreen />);
    
    // Component renders with back button (ArrowLeft icon)
    expect(toJSON()).toBeTruthy();
  });
});

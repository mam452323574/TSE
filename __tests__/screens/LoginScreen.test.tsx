import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import LoginScreen from '@/screens/LoginScreen';

// Mock dependencies
jest.mock('lucide-react-native', () => ({
  Heart: 'Heart',
  Mail: 'Mail',
  Lock: 'Lock',
  Eye: 'Eye',
  EyeOff: 'EyeOff',
}));

jest.mock('@/components/Button', () => ({
  Button: ({ title, onPress, loading }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} disabled={loading} testID="login-button">
        <Text>{loading ? 'Loading...' : title}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('@/components/OAuthButton', () => ({
  OAuthButton: () => null,
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockSignIn = jest.fn();
const mockSignInWithOAuth = jest.fn();
const mockSendVerificationEmail = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signInWithOAuth: mockSignInWithOAuth,
    sendVerificationEmail: mockSendVerificationEmail,
  }),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.mockResolvedValue({ needsVerification: false, userId: 'user-123' });
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<LoginScreen />);
    
    expect(toJSON()).toBeTruthy();
  });

  it('displays app title', () => {
    render(<LoginScreen />);
    
    expect(screen.getByText('Health Scan')).toBeTruthy();
  });

  it('displays login subtitle', () => {
    render(<LoginScreen />);
    
    expect(screen.getByText('Connectez-vous à votre compte')).toBeTruthy();
  });

  it('displays email and password inputs', () => {
    render(<LoginScreen />);
    
    expect(screen.getByPlaceholderText('votre@email.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('Entrez votre mot de passe')).toBeTruthy();
  });

  it('displays login button', () => {
    render(<LoginScreen />);
    
    expect(screen.getByText('Se connecter')).toBeTruthy();
  });

  it('displays signup link', () => {
    render(<LoginScreen />);
    
    expect(screen.getByText(/Pas encore de compte/)).toBeTruthy();
  });

  it('allows email input', () => {
    render(<LoginScreen />);
    
    const emailInput = screen.getByPlaceholderText('votre@email.com');
    fireEvent.changeText(emailInput, 'test@example.com');
    
    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('allows password input', () => {
    render(<LoginScreen />);
    
    const passwordInput = screen.getByPlaceholderText('Entrez votre mot de passe');
    fireEvent.changeText(passwordInput, 'password123');
    
    expect(passwordInput.props.value).toBe('password123');
  });

  it('shows error when submitting empty form', async () => {
    render(<LoginScreen />);
    
    fireEvent.press(screen.getByText('Se connecter'));
    
    expect(await screen.findByText('Veuillez remplir tous les champs')).toBeTruthy();
  });

  it('navigates to signup when link is pressed', () => {
    render(<LoginScreen />);
    
    const signupText = screen.getByText(/Pas encore de compte/);
    fireEvent.press(signupText.parent!);
    
    expect(mockPush).toHaveBeenCalledWith('/signup');
  });
});

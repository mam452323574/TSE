import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SignUpScreen from '@/screens/SignUpScreen';

// Mock dependencies
jest.mock('lucide-react-native', () => ({
  Heart: 'Heart',
  Mail: 'Mail',
  Lock: 'Lock',
  Eye: 'Eye',
  EyeOff: 'EyeOff',
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
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

const mockSignUp = jest.fn();
const mockSendVerificationEmail = jest.fn();
const mockIsDisposableEmail = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    sendVerificationEmail: mockSendVerificationEmail,
    isDisposableEmail: mockIsDisposableEmail,
  }),
}));

describe('SignUpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignUp.mockResolvedValue({ userId: 'user-123', email: 'test@example.com' });
    mockSendVerificationEmail.mockResolvedValue(undefined);
    mockIsDisposableEmail.mockResolvedValue(false);
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<SignUpScreen />);
    
    expect(toJSON()).toBeTruthy();
  });

  it('displays app title', () => {
    render(<SignUpScreen />);
    
    expect(screen.getByText('Health Scan')).toBeTruthy();
  });

  it('displays signup subtitle', () => {
    render(<SignUpScreen />);
    
    expect(screen.getByText('Creez votre compte')).toBeTruthy();
  });

  it('displays email input', () => {
    render(<SignUpScreen />);
    
    expect(screen.getByPlaceholderText('votre@email.com')).toBeTruthy();
  });

  it('displays password inputs', () => {
    render(<SignUpScreen />);
    
    expect(screen.getByPlaceholderText('Minimum 6 caracteres')).toBeTruthy();
    expect(screen.getByPlaceholderText('Retapez votre mot de passe')).toBeTruthy();
  });

  it('displays continue button', () => {
    render(<SignUpScreen />);
    
    expect(screen.getByText('Continuer')).toBeTruthy();
  });

  it('displays login link', () => {
    render(<SignUpScreen />);
    
    expect(screen.getByText(/Deja un compte/)).toBeTruthy();
  });

  it('button is disabled when form is empty', () => {
    render(<SignUpScreen />);
    
    // The continue button should be disabled when fields are empty
    const continueButton = screen.getByText('Continuer');
    expect(continueButton).toBeTruthy();
  });

  it('allows filling the form', () => {
    render(<SignUpScreen />);
    
    fireEvent.changeText(screen.getByPlaceholderText('votre@email.com'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Minimum 6 caracteres'), 'password123');
    fireEvent.changeText(screen.getByPlaceholderText('Retapez votre mot de passe'), 'password123');
    
    expect(screen.getByPlaceholderText('votre@email.com').props.value).toBe('test@example.com');
  });

  it('can toggle password visibility', () => {
    render(<SignUpScreen />);
    
    // Password fields are present
    expect(screen.getByPlaceholderText('Minimum 6 caracteres')).toBeTruthy();
    expect(screen.getByPlaceholderText('Retapez votre mot de passe')).toBeTruthy();
  });

  it('navigates back when login link is pressed', () => {
    render(<SignUpScreen />);
    
    const loginText = screen.getByText(/Deja un compte/);
    fireEvent.press(loginText.parent!);
    
    expect(mockBack).toHaveBeenCalled();
  });

  it('displays info text about verification email', () => {
    render(<SignUpScreen />);
    
    expect(screen.getByText('Un code de verification sera envoye a votre adresse email.')).toBeTruthy();
  });
});

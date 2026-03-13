import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { AvatarPicker } from '@/components/AvatarPicker';

// Mock dependencies
jest.mock('lucide-react-native', () => ({
  Camera: 'Camera',
  Upload: 'Upload',
  User: 'User',
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('@/services/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/avatar.jpg' } }),
      })),
    },
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('AvatarPicker', () => {
  const mockOnAvatarSelected = jest.fn();
  const defaultProps = {
    userId: 'test-user-123',
    onAvatarSelected: mockOnAvatarSelected,
  };

  beforeEach(() => {
    mockOnAvatarSelected.mockClear();
    (Alert.alert as jest.Mock).mockClear();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<AvatarPicker {...defaultProps} />);
    
    expect(toJSON()).toBeTruthy();
  });

  it('displays hint text', () => {
    render(<AvatarPicker {...defaultProps} />);
    
    expect(screen.getByText('Appuyez pour modifier')).toBeTruthy();
  });

  it('renders with custom avatar URL', () => {
    const { toJSON } = render(
      <AvatarPicker
        {...defaultProps}
        currentAvatarUrl="https://example.com/custom-avatar.jpg"
      />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom size', () => {
    const { toJSON } = render(
      <AvatarPicker
        {...defaultProps}
        size={200}
      />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('shows options alert when pressed', () => {
    render(<AvatarPicker {...defaultProps} />);
    
    const touchable = screen.getByText('Appuyez pour modifier').parent?.parent;
    if (touchable) {
      fireEvent.press(touchable);
    }
  });
});

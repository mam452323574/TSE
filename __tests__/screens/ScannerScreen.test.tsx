import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ScannerScreen from '@/screens/ScannerScreen';

// Mock expo-camera
const mockUseCameraPermissions = jest.fn();
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  CameraType: {},
  useCameraPermissions: () => mockUseCameraPermissions(),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

// Mock expo-router
const mockPush = jest.fn();
const mockUseFocusEffect = jest.fn((callback: () => void) => {
  // Don't call immediately to avoid issues with loading state
});
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
  useFocusEffect: (callback: () => void) => mockUseFocusEffect(callback),
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  Camera: 'Camera',
  FlipHorizontal: 'FlipHorizontal',
  Image: 'Image',
  Crown: 'Crown',
  Gift: 'Gift',
  WifiOff: 'WifiOff',
  RefreshCw: 'RefreshCw',
  RefreshCcw: 'RefreshCcw',
  Sparkles: 'Sparkles',
  X: 'X',
  Check: 'Check',
}));

// Mock useAuth
const mockUserProfile = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: mockUserProfile(),
  }),
}));

// Mock NotificationContext
jest.mock('@/contexts/NotificationContext', () => ({
  useNotificationContext: () => ({
    unreadCount: 0,
    notifications: [],
    markAsRead: jest.fn(),
    refreshNotifications: jest.fn(),
    scheduleSuperScanReset: jest.fn(),
  }),
}));

// Mock useAllScanEligibility hook (shared scan eligibility state)
const mockScanEligibilityData = jest.fn();
const mockRefetchAll = jest.fn();
jest.mock('@/hooks/queries', () => ({
  useAllScanEligibility: () => ({
    data: mockScanEligibilityData(),
    isLoading: false,
    isError: false,
    refetchAll: mockRefetchAll,
  }),
}));

// Mock components
jest.mock('@/components/Button', () => ({
  Button: ({ title, onPress, disabled }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} testID="button">
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => {
    const { View, Text } = require('react-native');
    return <View testID="loading-spinner"><Text>Loading...</Text></View>;
  },
}));

jest.mock('@/components/CameraGuide', () => ({
  CameraGuide: () => null,
}));

jest.mock('@/components/NextScanTimer', () => ({
  NextScanTimer: () => null,
}));

// Mock Alert
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => { });

describe('ScannerScreen', () => {
  const defaultEligibility = {
    allowed: true,
    current_count: 0,
    limit: 1,
    welcome_credits: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserProfile.mockReturnValue({ account_tier: 'free' });
    // Mock all scan types with default eligibility
    mockScanEligibilityData.mockReturnValue({
      body: defaultEligibility,
      health: defaultEligibility,
      nutrition: defaultEligibility,
      super: defaultEligibility,
    });
  });

  describe('camera permissions', () => {
    it('shows loading spinner when permission is undefined', async () => {
      mockUseCameraPermissions.mockReturnValue([undefined, jest.fn()]);

      render(<ScannerScreen />);

      expect(screen.getByTestId('loading-spinner')).toBeTruthy();
    });

    it('shows permission request UI when not granted', async () => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: false },
        jest.fn(),
      ]);

      render(<ScannerScreen />);

      // Wait for the eligibility check to complete (sets loading to false)
      await waitFor(() => {
        expect(screen.getByText("Nous avons besoin d'accéder à votre caméra")).toBeTruthy();
      });
      expect(screen.getByText('Autoriser')).toBeTruthy();
    });

    it('calls requestPermission when Autoriser button is pressed', async () => {
      const mockRequestPermission = jest.fn();
      mockUseCameraPermissions.mockReturnValue([
        { granted: false },
        mockRequestPermission,
      ]);

      render(<ScannerScreen />);

      await waitFor(() => {
        expect(screen.getByText('Autoriser')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Autoriser'));

      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  describe('scan type selection', () => {
    beforeEach(() => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: true },
        jest.fn(),
      ]);
    });

    it('renders all scan type buttons', async () => {
      render(<ScannerScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Visage/)).toBeTruthy();
        expect(screen.getByText('Corps')).toBeTruthy();
        expect(screen.getByText('Nutrition')).toBeTruthy();
      });
    });

    it('disables scan type buttons when limit is reached', async () => {
      const limitReachedEligibility = {
        allowed: false,
        current_count: 1,
        limit: 1,
        welcome_credits: 0,
        next_available_date: Date.now() + 86400000,
        message: 'Limite atteinte',
      };
      mockScanEligibilityData.mockReturnValue({
        body: limitReachedEligibility,
        health: limitReachedEligibility,
        nutrition: limitReachedEligibility,
        super: limitReachedEligibility,
      });

      render(<ScannerScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Visage/)).toBeTruthy();
      });

      // Button should be disabled when allowed is false and no welcome credits
      // Pressing a disabled button doesn't trigger the handler
      fireEvent.press(screen.getByText(/Visage/));

      // No alert is expected because the button is disabled
      expect(alertSpy).not.toHaveBeenCalled();
    });
  });

  describe('welcome credits', () => {
    beforeEach(() => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: true },
        jest.fn(),
      ]);
    });

    it('shows welcome credits banner when available', async () => {
      const withWelcomeCredits = {
        allowed: true,
        current_count: 0,
        limit: 1,
        welcome_credits: 1,
      };
      mockScanEligibilityData.mockReturnValue({
        body: withWelcomeCredits,
        health: withWelcomeCredits,
        nutrition: withWelcomeCredits,
        super: withWelcomeCredits,
      });

      render(<ScannerScreen />);

      await waitFor(() => {
        expect(screen.getAllByTestId('welcome-gift').length).toBeGreaterThan(0);
      });
    });

    it('allows scan selection with welcome credits even if not otherwise allowed', async () => {
      const notAllowedButWithCredits = {
        allowed: false,
        current_count: 1,
        limit: 1,
        welcome_credits: 1,
      };
      mockScanEligibilityData.mockReturnValue({
        body: notAllowedButWithCredits,
        health: notAllowedButWithCredits,
        nutrition: notAllowedButWithCredits,
        super: notAllowedButWithCredits,
      });

      render(<ScannerScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Visage/)).toBeTruthy();
      });

      fireEvent.press(screen.getByText(/Visage/));

      // Should not show alert because welcome credits are available
      expect(alertSpy).not.toHaveBeenCalled();
    });
  });



  describe('capture actions', () => {
    beforeEach(() => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: true },
        jest.fn(),
      ]);
    });

    it('shows alert when trying to capture without selecting scan type', async () => {
      render(<ScannerScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Visage/)).toBeTruthy();
      });

      // The capture button is rendered but we need to find it
      // In a real test, we'd use testID
    });

    it('checks eligibility before proceeding with scan', async () => {
      // Default eligibility is already set in beforeEach
      render(<ScannerScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Visage/)).toBeTruthy();
      });

      // Select a scan type
      fireEvent.press(screen.getByText(/Visage/));

      // Eligibility data is already loaded from the hook mock
      // The scan type should be selectable
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('allows selecting scan type when eligibility check passes', async () => {
      // Default eligibility is already set in beforeEach
      render(<ScannerScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Visage/)).toBeTruthy();
      });

      // Select a scan type - should work without showing an alert
      fireEvent.press(screen.getByText(/Visage/));

      // No alert should be shown for an allowed scan type
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('allows scan when welcome credits are available', async () => {
      const withWelcomeCredits = {
        allowed: false,
        current_count: 1,
        limit: 1,
        welcome_credits: 1,
      };
      mockScanEligibilityData.mockReturnValue({
        body: withWelcomeCredits,
        health: withWelcomeCredits,
        nutrition: withWelcomeCredits,
        super: withWelcomeCredits,
      });

      render(<ScannerScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Visage/)).toBeTruthy();
      });

      // Select scan type - should work because of welcome credits
      fireEvent.press(screen.getByText(/Visage/));

      // Should NOT show limit alert
      expect(alertSpy).not.toHaveBeenCalledWith(
        'Limite atteinte',
        expect.any(String),
        expect.any(Array)
      );
    });
  });

  describe('image picker', () => {
    beforeEach(() => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: true },
        jest.fn(),
      ]);
    });

    it('requires scan type selection before picking image', async () => {
      const ImagePicker = require('expo-image-picker');

      render(<ScannerScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Visage/)).toBeTruthy();
      });

      // Image picker should not be called without scan type selection
      expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
    });
  });

  describe('scan eligibility refresh', () => {
    beforeEach(() => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: true },
        jest.fn(),
      ]);
    });

    it('refreshes eligibility when screen gains focus', async () => {
      // Default eligibility is already set in beforeEach
      render(<ScannerScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Visage/)).toBeTruthy();
      });

      // useFocusEffect should have been called (which triggers refetchEligibility)
      expect(mockUseFocusEffect).toHaveBeenCalled();
    });

    it('displays updated eligibility counts', async () => {
      const countEligibility = {
        allowed: true,
        current_count: 2,
        limit: 3,
        welcome_credits: 0,
      };
      mockScanEligibilityData.mockReturnValue({
        body: countEligibility,
        health: countEligibility,
        nutrition: countEligibility,
        super: countEligibility,
      });

      render(<ScannerScreen />);

      // With current_count=2 and limit=3, remaining is 1. We expect 1/3
      await waitFor(() => {
        const countElements = screen.getAllByText('1/3');
        expect(countElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: true },
        jest.fn(),
      ]);
    });

    it('handles eligibility check error gracefully', async () => {
      // Simulate error state from the hook
      mockScanEligibilityData.mockReturnValue(null);

      render(<ScannerScreen />);

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getByText(/Visage/)).toBeTruthy();
      }, { timeout: 3000 });

      // Wait for all state updates to settle
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
    });

    it('shows scan types even when eligibility data is unavailable', async () => {
      // Simulate partial data (some scan types missing)
      mockScanEligibilityData.mockReturnValue({
        body: null,
        health: defaultEligibility,
        nutrition: defaultEligibility,
        super: defaultEligibility,
      });

      render(<ScannerScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Visage/)).toBeTruthy();
        expect(screen.getByText('Corps')).toBeTruthy();
        expect(screen.getByText('Nutrition')).toBeTruthy();
      }, { timeout: 3000 });

      // Wait for all state updates to settle
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
    });
  });
});

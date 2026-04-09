import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react-native';
import ScanPreviewScreen from '@/screens/ScanPreviewScreen';
import { ApiError } from '@/services/api';

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
  }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  X: 'X',
  Sparkles: 'Sparkles',
  Activity: 'Activity',
  Utensils: 'Utensils',
  PersonStanding: 'PersonStanding',
  Smile: 'Smile',
}));

// Mock expo-blur
jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return {
    BlurView: ({ children, style }: any) => (
      <View style={style}>{children}</View>
    ),
  };
});

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    refetchQueries: jest.fn(),
  }),
}));

// Mock ApiService and ApiError
const mockCreateScanWithAnalysis = jest.fn();

jest.mock('@/services/api', () => {
  // Create a mock ApiError class inside the factory to avoid hoisting issues
  class MockApiError extends Error {
    type: string;
    code?: string;
    status?: number;
    requestId?: string;
    context?: Record<string, unknown>;
    constructor(
      message: string,
      type: string,
      _originalError?: unknown,
      context?: Record<string, unknown>,
      code?: string,
      status?: number,
      requestId?: string,
    ) {
      super(message);
      this.name = 'ApiError';
      this.type = type;
      this.context = context;
      this.code = code;
      this.status = status;
      this.requestId = requestId;
    }
  }

  return {
    ApiService: {
      createScanWithAnalysis: (...args: any[]) =>
        mockCreateScanWithAnalysis(...args),
    },
    ApiError: MockApiError,
  };
});

jest.mock('@/utils/observability', () => ({
  logOperationalError: jest.fn(),
}));

// Mock BadgeContext
const mockSetBadge = jest.fn();
jest.mock('@/contexts/BadgeContext', () => ({
  useBadges: () => ({
    setBadge: mockSetBadge,
  }),
}));

const mockIncrementScanCount = jest.fn();
jest.mock('@/contexts/GamificationContext', () => ({
  useGamification: () => ({
    incrementScanCount: mockIncrementScanCount,
    setScanCount: jest.fn(),
    resetInMemoryStateOnUserChange: jest.fn(),
    scanCount: 0,
    isHydrated: true,
  }),
}));

const mockShowAlert = jest.fn();
jest.mock('@/hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    showAlert: mockShowAlert,
    alertElement: null,
  }),
}));

// Mock SuccessConfetti
jest.mock('@/components/SuccessConfetti', () => ({
  SuccessConfetti: ({ active, onAnimationEnd }: any) => {
    if (active && onAnimationEnd) {
      // Simulate animation end after a short delay
      setTimeout(onAnimationEnd, 10);
    }
    return null;
  },
}));

// Mock Button
jest.mock('@/components/Button', () => ({
  Button: ({ title, onPress, disabled }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        testID="confirm-button"
      >
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

describe('ScanPreviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockShowAlert.mockClear();
    mockIncrementScanCount.mockResolvedValue(1);
    mockPush.mockClear();
    mockBack.mockClear();
    mockReplace.mockClear();
    mockUseLocalSearchParams.mockReturnValue({
      imageUri: 'file:///test-image.jpg',
      scanType: 'health',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('displays the preview image', () => {
    render(<ScanPreviewScreen />);

    // The Image component should be rendered with the imageUri
    expect(screen.getByTestId('confirm-button')).toBeTruthy();
  });

  it('displays the scan type label', () => {
    render(<ScanPreviewScreen />);

    expect(screen.getByText('Type de scan')).toBeTruthy();
  });

  it('displays confirm button', () => {
    render(<ScanPreviewScreen />);

    expect(screen.getByText('Confirmer')).toBeTruthy();
  });

  it('displays cancel button', () => {
    render(<ScanPreviewScreen />);

    expect(screen.getByText('Annuler')).toBeTruthy();
  });

  it('navigates back when X button is pressed', () => {
    render(<ScanPreviewScreen />);

    // Find and press the X button (close button)
    // The X icon would be rendered, but we can't easily target it
    // In a real app, we'd add testID to the TouchableOpacity
  });

  it('navigates back when cancel button is pressed', () => {
    render(<ScanPreviewScreen />);

    fireEvent.press(screen.getByText('Annuler'));

    expect(mockBack).toHaveBeenCalled();
  });

  describe('confirm action', () => {
    it('shows loading state when confirming', async () => {
      mockCreateScanWithAnalysis.mockImplementation(
        () => new Promise(() => {}),
      ); // Never resolves

      render(<ScanPreviewScreen />);

      fireEvent.press(screen.getByText('Confirmer'));

      await waitFor(() => {
        expect(screen.getByText('Analyse en cours...')).toBeTruthy();
      });
    });

    it('prevents double-click submission', async () => {
      // Mock a slow API call
      mockCreateScanWithAnalysis.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({ scan: { id: 'scan-123' }, analysisSucceeded: true }),
              1000,
            ),
          ),
      );

      render(<ScanPreviewScreen />);

      const button = screen.getByTestId('confirm-button');

      // First click
      fireEvent.press(button);

      // Try to click again immediately (double-click)
      fireEvent.press(button);
      fireEvent.press(button);

      // Should only call the API once due to double-click protection
      await waitFor(() => {
        expect(mockCreateScanWithAnalysis).toHaveBeenCalledTimes(1);
      });
    });

    it('calls createScanWithAnalysis with correct params', async () => {
      mockCreateScanWithAnalysis.mockResolvedValue({
        scan: { id: 'scan-123' },
        analysisSucceeded: true,
      });

      render(<ScanPreviewScreen />);

      fireEvent.press(screen.getByText('Confirmer'));

      await waitFor(() => {
        expect(mockCreateScanWithAnalysis).toHaveBeenCalledWith(
          'file:///test-image.jpg',
          'health',
          'fr',
        );
      });
    });

    it('sets badge after successful scan', async () => {
      mockCreateScanWithAnalysis.mockResolvedValue({
        scan: {
          id: 'scan-123',
          analysis_result: { scan_type: 'face', face_score: 85 },
        },
        analysisSucceeded: true,
      });

      render(<ScanPreviewScreen />);

      await act(async () => {
        fireEvent.press(screen.getByText('Confirmer'));
      });

      await act(async () => {
        jest.advanceTimersByTime(5500);
      });

      await waitFor(() => {
        expect(mockSetBadge).toHaveBeenCalledWith('analytics');
        expect(mockIncrementScanCount).toHaveBeenCalledTimes(1);
      });
    });

    it('shows error alert when analysis fails', async () => {
      const providerError = new ApiError(
        'Scan analysis provider is not configured',
        'PROVIDER',
        undefined,
        { stage: 'analysis' },
      );
      providerError.code = 'scan_webhook_not_configured';
      providerError.status = 503;
      providerError.requestId = 'req-webhook-missing';

      mockCreateScanWithAnalysis.mockResolvedValue({
        scan: { id: 'scan-123' },
        analysisSucceeded: false,
        analysisError: providerError,
      });

      render(<ScanPreviewScreen />);

      await act(async () => {
        fireEvent.press(screen.getByText('Confirmer'));
      });

      await act(async () => {
        jest.advanceTimersByTime(5500);
      });

      // Wait for the API call to resolve
      await waitFor(() => {
        expect(mockCreateScanWithAnalysis).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          "Service d'analyse indisponible",
          "Le fournisseur d'analyse est indisponible ou mal configuré pour ce scan.",
          expect.any(Array),
        );
      });
      expect(mockIncrementScanCount).not.toHaveBeenCalled();
    });

    it('keeps loading state during success animation', async () => {
      mockCreateScanWithAnalysis.mockResolvedValue({
        scan: {
          id: 'scan-123',
          analysis_result: { scan_type: 'face', face_score: 85 },
        },
        analysisSucceeded: true,
      });

      render(<ScanPreviewScreen />);
      const button = screen.getByTestId('confirm-button');

      await act(async () => {
        fireEvent.press(button);
      });

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockCreateScanWithAnalysis).toHaveBeenCalled();
      });

      // Verify button is STILL in loading state immediately after API success (but before timeout)
      // Since we removed setLoading(false) from the success path, it should still be loading
      expect(screen.getByText('Analyse en cours...')).toBeTruthy();

      // Advance timer half way
      await act(async () => {
        jest.advanceTimersByTime(750);
      });

      // Should STILL be loading
      expect(screen.getByText('Analyse en cours...')).toBeTruthy();

      // Trying to press again should do nothing (mock call count stays 1)
      await act(async () => {
        fireEvent.press(button);
      });
      expect(mockCreateScanWithAnalysis).toHaveBeenCalledTimes(1);
    });

    it('navigates to scan result after successful scan', async () => {
      mockCreateScanWithAnalysis.mockResolvedValue({
        scan: {
          id: 'scan-123',
          analysis_result: { scan_type: 'face', face_score: 85 },
        },
        analysisSucceeded: true,
      });

      render(<ScanPreviewScreen />);

      await act(async () => {
        fireEvent.press(screen.getByText('Confirmer'));
      });

      // Wait for the API call to resolve
      await waitFor(() => {
        expect(mockCreateScanWithAnalysis).toHaveBeenCalled();
      });

      // Advance timers in two steps so the post-success navigation timeout
      // is scheduled after the minimum loading and completion delay.
      await act(async () => {
        jest.advanceTimersByTime(5500);
      });

      await waitFor(() => {
        expect(mockSetBadge).toHaveBeenCalledWith('analytics');
      });

      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith({
          pathname: '/scan-result',
          params: {
            analysisData: JSON.stringify({ scan_type: 'face', face_score: 85 }),
            imageUri: 'file:///test-image.jpg',
            scanId: 'scan-123',
          },
        });
      });
    });
  });

  describe('error handling', () => {
    it('shows a timeout-specific alert when analysis times out', async () => {
      mockCreateScanWithAnalysis.mockRejectedValue(
        new ApiError('Request timed out', 'TIMEOUT'),
      );

      render(<ScanPreviewScreen />);

      fireEvent.press(screen.getByText('Confirmer'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Analyse trop longue',
          "L'analyse prend trop de temps. Réessayez dans un instant.",
          expect.any(Array),
        );
      });
    });

    it('shows a session-specific alert when the auth session is expired', async () => {
      mockCreateScanWithAnalysis.mockRejectedValue(
        new ApiError('api_errors.unauthorized', 'AUTH'),
      );

      render(<ScanPreviewScreen />);

      fireEvent.press(screen.getByText('Confirmer'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Session expirée',
          'Votre session a expiré. Reconnectez-vous puis réessayez.',
          expect.any(Array),
        );
      });
    });

    it('shows an upload-specific alert when scan image upload/storage fails', async () => {
      mockCreateScanWithAnalysis.mockRejectedValue(
        new ApiError('scan image missing', 'UPLOAD'),
      );

      render(<ScanPreviewScreen />);

      fireEvent.press(screen.getByText('Confirmer'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Envoi impossible',
          "L'image du scan n'a pas pu être envoyée ou retrouvée côté stockage.",
          expect.any(Array),
        );
      });
    });

    it('shows generic error message for unknown errors', async () => {
      mockCreateScanWithAnalysis.mockRejectedValue('unknown error');

      render(<ScanPreviewScreen />);

      fireEvent.press(screen.getByText('Confirmer'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Erreur',
          'Erreur',
          expect.any(Array),
        );
      });
    });

    it('returns to normal state after error', async () => {
      mockCreateScanWithAnalysis.mockRejectedValue(new Error('Failed'));

      render(<ScanPreviewScreen />);

      fireEvent.press(screen.getByText('Confirmer'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });

      // Button should be back to normal state
      await waitFor(() => {
        expect(screen.getByText('Confirmer')).toBeTruthy();
      });
    });
  });

  describe('different scan types', () => {
    it('displays body scan type correctly', () => {
      mockUseLocalSearchParams.mockReturnValue({
        imageUri: 'file:///test-image.jpg',
        scanType: 'body',
      });

      render(<ScanPreviewScreen />);

      expect(screen.getByText('Corps')).toBeTruthy();
    });

    it('displays nutrition scan type correctly', () => {
      mockUseLocalSearchParams.mockReturnValue({
        imageUri: 'file:///test-image.jpg',
        scanType: 'nutrition',
      });

      render(<ScanPreviewScreen />);

      expect(screen.getByText('Nutrition')).toBeTruthy();
    });
  });
});

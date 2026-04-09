import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import CoachScreen from '@/screens/CoachScreen';
import { CoachServiceError } from '@/services/coach';

const mockMutateAsync = jest.fn();
const mockUseCoachEntries = jest.fn();
const mockUseCoachGeneration = jest.fn();
const mockUseQuery = jest.fn();
const mockTrackEvent = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();
const mockRouterDismiss = jest.fn();
const mockRouterCanDismiss = jest.fn();
const mockUpdateCoachPersona = jest.fn();
const mockShowAlert = jest.fn();

let mockAuthState = {
  user: { id: 'user-1' },
  userProfile: {
    id: 'user-1',
    account_tier: 'free',
    coach_persona_key: 'gentle_supportive',
  },
  updateCoachPersona: (...args: unknown[]) => mockUpdateCoachPersona(...args),
};

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => mockRouterPush(...args),
    back: (...args: unknown[]) => mockRouterBack(...args),
    dismiss: (...args: unknown[]) => mockRouterDismiss(...args),
    canDismiss: (...args: unknown[]) => mockRouterCanDismiss(...args),
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('@/hooks/queries', () => ({
  useCoachEntries: () => mockUseCoachEntries(),
  useCoachGeneration: () => mockUseCoachGeneration(),
}));

jest.mock('@/services/growthExperience', () => ({
  markCoachSeen: jest.fn(),
}));

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

jest.mock('@/hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertElement: null,
    showAlert: (...args: unknown[]) => mockShowAlert(...args),
  }),
}));

describe('CoachScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterCanDismiss.mockReturnValue(false);
    mockAuthState = {
      user: { id: 'user-1' },
      userProfile: {
        id: 'user-1',
        account_tier: 'free',
        coach_persona_key: 'gentle_supportive',
      },
      updateCoachPersona: (...args: unknown[]) => mockUpdateCoachPersona(...args),
    };
    mockUseQuery.mockReturnValue({
      data: [],
      error: null,
      isFetching: false,
      refetch: jest.fn(),
    });
    mockUseCoachEntries.mockReturnValue({
      data: [
        {
          id: 'entry-1',
          title: 'Saved coach guidance',
          body: 'Keep your hydration steady and sleep on time.',
          disclaimer:
            'Wellness guidance only. This is not a diagnosis or medical advice.',
          persona_key: 'gentle_supportive',
          cta_label: null,
          cta_route: null,
          created_at: '2026-04-06T08:00:00.000Z',
          source: 'n8n',
          status: 'ready',
        },
      ],
      error: null,
      isFetching: false,
      refetch: jest.fn(),
    });
    mockUseCoachGeneration.mockReturnValue({
      data: null,
      isPending: false,
      isError: false,
      error: null,
      mutateAsync: (...args: unknown[]) => mockMutateAsync(...args),
    });
    mockMutateAsync.mockResolvedValue({
      success: true,
      entry_id: 'entry-new',
      persona_key: 'gentle_supportive',
      cached: false,
      fallback: false,
      status: 'ready',
      title: 'Fresh guidance',
      body: 'Keep showing up this week.',
      disclaimer:
        'Wellness guidance only. This is not a diagnosis or medical advice.',
      cta_label: null,
      cta_route: null,
      source: 'n8n',
      expires_at: null,
      response_payload_json: {},
      payload: {},
    });
    mockUpdateCoachPersona.mockResolvedValue(undefined);
  });

  it('renders the coach guidance state with all six persona options', () => {
    const screen = render(<CoachScreen />);

    expect(screen.getByTestId('coach-guidance-card')).toBeTruthy();
    expect(screen.getByTestId('coach-back-button')).toBeTruthy();
    expect(screen.getByTestId('coach-guidance-disclaimer').props.children).toContain(
      'not a diagnosis',
    );
    expect(screen.getByTestId('coach-persona-gentle_supportive')).toBeTruthy();
    expect(screen.getByTestId('coach-persona-strict_tough')).toBeTruthy();
    expect(screen.getByTestId('coach-persona-motivational_energetic')).toBeTruthy();
    expect(screen.getByTestId('coach-persona-patient_calm')).toBeTruthy();
    expect(screen.getByTestId('coach-persona-analytical_precise')).toBeTruthy();
    expect(screen.getByTestId('coach-persona-playful_light')).toBeTruthy();
  });

  it('uses the header back action to leave the screen', () => {
    const screen = render(<CoachScreen />);

    fireEvent.press(screen.getByTestId('coach-back-button'));

    expect(mockRouterCanDismiss).toHaveBeenCalled();
    expect(mockRouterBack).toHaveBeenCalled();
    expect(mockRouterDismiss).not.toHaveBeenCalled();
  });

  it('dismisses the screen when the router supports dismissing', () => {
    mockRouterCanDismiss.mockReturnValue(true);

    const screen = render(<CoachScreen />);

    fireEvent.press(screen.getByTestId('coach-back-button'));

    expect(mockRouterDismiss).toHaveBeenCalled();
    expect(mockRouterBack).not.toHaveBeenCalled();
  });

  it('routes free users to the premium upgrade when they tap a locked persona', async () => {
    const screen = render(<CoachScreen />);

    fireEvent.press(screen.getByTestId('coach-persona-strict_tough'));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/premium-upgrade');
    });
    expect(mockUpdateCoachPersona).not.toHaveBeenCalled();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('uses the default free persona when a free profile has a locked persona stored', async () => {
    mockAuthState = {
      ...mockAuthState,
      userProfile: {
        id: 'user-1',
        account_tier: 'free',
        coach_persona_key: 'strict_tough',
      },
    };

    const screen = render(<CoachScreen />);

    fireEvent.press(screen.getByTestId('coach-prompt-latest_scan'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        promptType: 'latest_scan',
        personaKey: 'gentle_supportive',
      });
    });
  });

  it('lets premium users persist a premium persona and generate guidance with it', async () => {
    mockAuthState = {
      ...mockAuthState,
      userProfile: {
        id: 'user-1',
        account_tier: 'premium',
        coach_persona_key: 'gentle_supportive',
      },
    };

    const screen = render(<CoachScreen />);

    fireEvent.press(screen.getByTestId('coach-persona-analytical_precise'));

    await waitFor(() => {
      expect(mockUpdateCoachPersona).toHaveBeenCalledWith('analytical_precise');
    });

    mockAuthState = {
      ...mockAuthState,
      userProfile: {
        id: 'user-1',
        account_tier: 'premium',
        coach_persona_key: 'analytical_precise',
      },
    };

    screen.rerender(<CoachScreen />);
    fireEvent.press(screen.getByTestId('coach-prompt-latest_scan'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        promptType: 'latest_scan',
        personaKey: 'analytical_precise',
      });
    });
  });

  it('shows a query error state when coach data loading fails before generation', () => {
    mockUseCoachEntries.mockReturnValue({
      data: [],
      error: new Error(
        'Coach data table "coach_entries" is unavailable on Supabase project "test".',
      ),
      isFetching: false,
      refetch: jest.fn(),
    });

    const screen = render(<CoachScreen />);

    expect(screen.getByTestId('coach-query-error-state')).toBeTruthy();
    expect(screen.getByText(/coach_entries/i)).toBeTruthy();
  });

  it('shows a dedicated unavailable state for the provider-not-configured generation error', () => {
    mockUseCoachEntries.mockReturnValue({
      data: [],
      error: null,
      isFetching: false,
      refetch: jest.fn(),
    });
    mockUseCoachGeneration.mockReturnValue({
      data: null,
      isPending: false,
      isError: true,
      error: new CoachServiceError('Coach generation provider is not configured', {
        code: 'coach_webhook_not_configured',
        status: 503,
      }),
      mutateAsync: (...args: unknown[]) => mockMutateAsync(...args),
    });

    const screen = render(<CoachScreen />);

    expect(screen.getByTestId('coach-unavailable-state')).toBeTruthy();
    expect(screen.queryByTestId('coach-error-state')).toBeNull();
    expect(screen.queryByTestId('coach-empty-state')).toBeNull();
  });

  it('keeps prompts disabled when the newest coach entry shows provider unavailable', () => {
    mockUseCoachEntries.mockReturnValue({
      data: [
        {
          id: 'entry-provider-error',
          title: 'Unavailable',
          body: 'Provider missing.',
          disclaimer:
            'Wellness guidance only. This is not a diagnosis or medical advice.',
          persona_key: 'gentle_supportive',
          cta_label: null,
          cta_route: null,
          created_at: '2026-04-06T08:00:00.000Z',
          source: 'n8n',
          status: 'error',
          error_code: 'coach_webhook_not_configured',
        },
      ],
      error: null,
      isFetching: false,
      refetch: jest.fn(),
    });

    const screen = render(<CoachScreen />);

    expect(screen.getByTestId('coach-unavailable-state')).toBeTruthy();

    fireEvent.press(screen.getByTestId('coach-prompt-latest_scan'));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('keeps the no-recent-scans state separate from provider unavailability', () => {
    mockUseCoachEntries.mockReturnValue({
      data: [],
      error: null,
      isFetching: false,
      refetch: jest.fn(),
    });

    const screen = render(<CoachScreen />);

    expect(screen.getByTestId('coach-empty-state')).toBeTruthy();
    expect(screen.queryByTestId('coach-unavailable-state')).toBeNull();
  });

  it('surfaces persona save parity errors instead of only tracking analytics', async () => {
    mockAuthState = {
      ...mockAuthState,
      userProfile: {
        id: 'user-1',
        account_tier: 'premium',
        coach_persona_key: 'gentle_supportive',
      },
    };
    mockUpdateCoachPersona.mockRejectedValueOnce(
      new Error(
        'Coach persona is unavailable because "user_profiles.coach_persona_key" is missing on the configured Supabase project.',
      ),
    );

    const screen = render(<CoachScreen />);

    fireEvent.press(screen.getByTestId('coach-persona-analytical_precise'));

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        'coach.error_title',
        expect.stringContaining('coach_persona_key'),
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.any(String),
          }),
        ]),
      );
    });
  });
});

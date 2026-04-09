import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import SuperScanResultScreen from '@/screens/SuperScanResultScreen';
import { i18n, loadLocalesForTests } from '@/i18n/translations';

const mockCanDismiss = jest.fn();
const mockDismissAll = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockParams = jest.fn();
const mockUsePremiumPotential = jest.fn();
const mockUseFeatureFlags = jest.fn();
const mockShowAlert = jest.fn();
const mockResolveAvatarUrl = jest.fn();
const mockSaveShareStorySocialComposerDraft = jest.fn();
let mockUserProfile: any = { account_tier: 'free' };
let mockAuthLoading = false;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    canDismiss: mockCanDismiss,
    dismissAll: mockDismissAll,
    replace: mockReplace,
    push: mockPush,
  }),
  useLocalSearchParams: () => mockParams(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: mockUserProfile,
    loading: mockAuthLoading,
  }),
}));

jest.mock('@/hooks/queries', () => ({
  usePremiumPotential: (...args: any[]) => mockUsePremiumPotential(...args),
  useFeatureFlags: (...args: any[]) => mockUseFeatureFlags(...args),
}));

jest.mock('@/hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertElement: null,
    showAlert: (...args: unknown[]) => mockShowAlert(...args),
  }),
}));

jest.mock('@/services/avatar', () => ({
  resolveAvatarUrl: (...args: unknown[]) => mockResolveAvatarUrl(...args),
}));

jest.mock('@/services/socialDraftStore', () => ({
  saveShareStorySocialComposerDraft: (...args: unknown[]) =>
    mockSaveShareStorySocialComposerDraft(...args),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#007AFF',
      warning: '#FF9500',
      error: '#FF3B30',
      success: '#34C759',
      gold: '#FFD700',
      cardBackground: '#FFFFFF',
      background: '#F2F2F7',
      primaryText: '#1D1D1F',
      gray: '#8E8E93',
      white: '#FFFFFF',
    },
    isDark: false,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

jest.mock('@/components/ModalHandle', () => ({
  ModalHandle: () => null,
}));

jest.mock('@/components/UrgencyModal', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return {
    UrgencyModal: ({ visible }: { visible: boolean }) =>
      visible
        ? ReactLocal.createElement(Text, { testID: 'urgency-modal' }, 'Urgency')
        : null,
  };
});

jest.mock('@/components/ConditionCard', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return {
    ConditionCard: ({ condition, premiumRenderState }: any) =>
      ReactLocal.createElement(
        Text,
        { testID: `condition-card-${condition.severity_key}-${condition.probability}` },
        `${condition.severity_key}:${premiumRenderState}`,
      ),
  };
});

jest.mock('@/components/TrajectoryPreviewCard', () => ({
  TrajectoryPreviewCard: ({ model, onPress }: any) => {
    const ReactLocal = require('react');
    const {
      Text: RNText,
      TouchableOpacity: RNTouchableOpacity,
      View: RNView,
    } = require('react-native');

    return ReactLocal.createElement(
      RNView,
      { testID: 'trajectory-preview-card' },
      ReactLocal.createElement(RNText, { testID: 'trajectory-premium-state' }, model.premiumRenderState),
      ReactLocal.createElement(RNText, null, model.hookLabel),
      model.ctaLabel && onPress
        ? ReactLocal.createElement(
            RNTouchableOpacity,
            { onPress, testID: 'trajectory-preview-cta' },
            ReactLocal.createElement(RNText, null, model.ctaLabel),
          )
        : null,
    );
  },
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: require('@/i18n/translations').i18n.locale,
    t: (key: string, options?: Record<string, unknown>) =>
      String(require('@/i18n/translations').i18n.t(key, options)),
  }),
}));

const makeResult = (overrides: Partial<any> = {}) => ({
  schema_version: 3,
  scan_type: 'super_health_v2',
  global_risk_score: 62,
  urgency_flag: false,
  summary_key: 'medical_attention',
  detected_conditions: [
    {
      condition_key: 'low',
      category_key: 'general',
      probability: 20,
      severity_key: 'low',
      explanation_key: 'low',
      advice_key: 'low',
    },
    {
      condition_key: 'high',
      category_key: 'general',
      probability: 81,
      severity_key: 'high',
      explanation_key: 'high',
      advice_key: 'high',
    },
    {
      condition_key: 'mod',
      category_key: 'general',
      probability: 48,
      severity_key: 'moderate',
      explanation_key: 'mod',
      advice_key: 'mod',
    },
  ],
  disclaimer_key: 'general',
  ...overrides,
});

describe('SuperScanResultScreen', () => {
  beforeAll(async () => {
    await loadLocalesForTests();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    i18n.locale = 'en';
    mockUserProfile = { account_tier: 'free' };
    mockAuthLoading = false;
    mockCanDismiss.mockReturnValue(false);
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: false,
      },
      isFetching: false,
    });
    mockResolveAvatarUrl.mockResolvedValue(null);
    mockSaveShareStorySocialComposerDraft.mockResolvedValue({
      id: 'draft-super-community-1',
    });
    mockUsePremiumPotential.mockReturnValue({
      data: {
        currentScan: null,
        historicalAverage30d: 64,
        scanCountTotal: 4,
        recentScoreHistory: [
          { date: '2026-03-01', score: 68 },
          { date: '2026-03-10', score: 64 },
        ],
      },
      isLoading: false,
      error: null,
    });
  });

  it('renders fallback state when analysis data is missing', () => {
    mockParams.mockReturnValue({});

    const { getByText, getByTestId } = render(<SuperScanResultScreen />);

    expect(getByTestId('super-scan-empty-state')).toBeTruthy();
    expect(getByText(i18n.t('common.results.no_data'))).toBeTruthy();
    expect(getByText(i18n.t('common.home_back'))).toBeTruthy();
  });

  it('renders a controlled summary fallback and translated disclaimer text', () => {
    mockParams.mockReturnValue({
      analysisData: JSON.stringify(makeResult()),
    });

    const { getByText } = render(<SuperScanResultScreen />);

    expect(getByText(i18n.t('scan.super.summaries.medical_attention'))).toBeTruthy();
    expect(getByText(i18n.t('scan.super.disclaimers.general'))).toBeTruthy();
  });

  it('renders the locked trajectory and locked condition cards for free users', () => {
    mockParams.mockReturnValue({
      analysisData: JSON.stringify(makeResult()),
    });

    const { getByTestId, getByText } = render(<SuperScanResultScreen />);

    expect(getByTestId('trajectory-preview-card')).toBeTruthy();
    expect(getByTestId('trajectory-premium-state')).toHaveTextContent('locked');
    expect(getByText('high:locked')).toBeTruthy();
    expect(getByText('moderate:locked')).toBeTruthy();
    expect(getByText('low:locked')).toBeTruthy();
  });

  it.each(['premium', 'admin'] as const)(
    'renders the unlocked trajectory and condition cards for %s users',
    (accountTier) => {
      mockUserProfile = { account_tier: accountTier };
      mockParams.mockReturnValue({
        analysisData: JSON.stringify(makeResult()),
      });

      const { getByTestId, queryByTestId, getByText } = render(
        <SuperScanResultScreen />,
      );

      expect(getByTestId('trajectory-premium-state')).toHaveTextContent('unlocked');
      expect(queryByTestId('trajectory-preview-cta')).toBeNull();
      expect(getByText('high:unlocked')).toBeTruthy();
    },
  );

  it('renders a neutral loading state when auth is unresolved', () => {
    mockUserProfile = null;
    mockAuthLoading = true;
    mockParams.mockReturnValue({
      analysisData: JSON.stringify(makeResult()),
    });

    const { getByTestId, queryByTestId, getByText } = render(
      <SuperScanResultScreen />,
    );

    expect(getByTestId('trajectory-premium-state')).toHaveTextContent('loading');
    expect(queryByTestId('trajectory-preview-cta')).toBeNull();
    expect(getByText('high:loading')).toBeTruthy();
  });

  it('keeps the premium trajectory card visible when premium potential data is unavailable', () => {
    mockUserProfile = { account_tier: 'premium' };
    mockUsePremiumPotential.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Fetch error'),
    });
    mockParams.mockReturnValue({
      analysisData: JSON.stringify(makeResult()),
    });

    const { getByTestId, queryByTestId } = render(<SuperScanResultScreen />);

    expect(getByTestId('trajectory-premium-state')).toHaveTextContent('unlocked');
    expect(queryByTestId('trajectory-preview-cta')).toBeNull();
  });

  it('renders RAS card when no detected condition is returned', () => {
    mockParams.mockReturnValue({
      analysisData: JSON.stringify(makeResult({ detected_conditions: [] })),
    });

    const { getByTestId, getByText } = render(<SuperScanResultScreen />);

    expect(getByTestId('super-scan-ras')).toBeTruthy();
    expect(getByText(i18n.t('scan.super.ras_title'))).toBeTruthy();
  });

  it('shows urgency modal when urgency flag is true', () => {
    mockParams.mockReturnValue({
      analysisData: JSON.stringify(makeResult({ urgency_flag: true })),
    });

    const { getByTestId } = render(<SuperScanResultScreen />);

    expect(getByTestId('urgency-modal')).toBeTruthy();
  });

  it('keeps back button and routes to tabs when modal cannot dismiss', () => {
    mockParams.mockReturnValue({
      analysisData: JSON.stringify(makeResult()),
    });

    const { getByTestId } = render(<SuperScanResultScreen />);

    fireEvent.press(getByTestId('super-scan-back-button'));

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    expect(mockDismissAll).not.toHaveBeenCalled();
  });

  it('routes the share CTA with normalized analysis data', () => {
    mockParams.mockReturnValue({
      analysisData: JSON.stringify(makeResult()),
      imageUri: 'file:///super.jpg',
      scanId: 'scan-super-1',
    });

    const { getByTestId } = render(<SuperScanResultScreen />);

    fireEvent.press(getByTestId('super-scan-share-button'));

    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushedRoute = mockPush.mock.calls[0][0];

    expect(pushedRoute).toMatchObject({
      pathname: '/share-story',
      params: {
        imageUri: 'file:///super.jpg',
        scanId: 'scan-super-1',
      },
    });
    const normalizedPayload = JSON.parse(pushedRoute.params.analysisData);

    expect(normalizedPayload).toMatchObject({
      schema_version: 3,
      scan_type: 'super_health_v2',
      summary_key: 'medical_attention',
      disclaimer_key: 'general',
    });
    expect(normalizedPayload.detected_conditions).toHaveLength(3);
  });

  it('opens the share chooser when social sharing is enabled and keeps the external route intact', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: true,
      },
      isFetching: false,
    });
    mockParams.mockReturnValue({
      analysisData: JSON.stringify(makeResult()),
      imageUri: 'file:///super.jpg',
      scanId: 'scan-super-1',
    });

    const { getByTestId } = render(<SuperScanResultScreen />);

    fireEvent.press(getByTestId('super-scan-share-button'));

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockShowAlert).toHaveBeenCalledWith(
      i18n.t('share_story.chooser.title'),
      i18n.t('share_story.chooser.message'),
      expect.any(Array),
      undefined,
      expect.objectContaining({ variant: 'info' }),
    );

    const chooserButtons = mockShowAlert.mock.calls[0][2] as Array<{
      text: string;
      onPress?: () => void;
    }>;
    const externalButton = chooserButtons.find(
      (button) => button.text === i18n.t('share_story.chooser.external_action'),
    );

    externalButton?.onPress?.();

    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushedRoute = mockPush.mock.calls[0][0];

    expect(pushedRoute).toMatchObject({
      pathname: '/share-story',
      params: {
        imageUri: 'file:///super.jpg',
        scanId: 'scan-super-1',
      },
    });
    expect(JSON.parse(pushedRoute.params.analysisData)).toMatchObject({
      schema_version: 3,
      scan_type: 'super_health_v2',
      summary_key: 'medical_attention',
      disclaimer_key: 'general',
    });
  });

  it('routes the community chooser action through the typed social draft handoff', async () => {
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: true,
      },
      isFetching: false,
    });
    mockParams.mockReturnValue({
      analysisData: JSON.stringify(makeResult()),
      imageUri: 'file:///super.jpg',
      scanId: 'scan-super-1',
    });

    const { getByTestId } = render(<SuperScanResultScreen />);

    fireEvent.press(getByTestId('super-scan-share-button'));

    const chooserButtons = mockShowAlert.mock.calls[0][2] as Array<{
      text: string;
      onPress?: () => void;
    }>;
    const communityButton = chooserButtons.find(
      (button) => button.text === i18n.t('share_story.chooser.community_action'),
    );

    await act(async () => {
      communityButton?.onPress?.();
    });

    await waitFor(() => {
      expect(mockSaveShareStorySocialComposerDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          scanId: 'scan-super-1',
          payload: expect.objectContaining({
            variant: 'super',
            heroImageUri: 'file:///super.jpg',
            score: 62,
          }),
        }),
      );
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/social-compose',
      params: {
        draftId: 'draft-super-community-1',
      },
    });
  });

  it('uses a shrink-to-fit share CTA label without forcing the text to stretch', () => {
    mockParams.mockReturnValue({
      analysisData: JSON.stringify(makeResult()),
    });

    const { getByText } = render(<SuperScanResultScreen />);
    const shareLabel = getByText(i18n.t('share_story.actions.share_report'));
    const shareLabelStyle = StyleSheet.flatten(shareLabel.props.style);

    expect(shareLabel.props.adjustsFontSizeToFit).toBe(true);
    expect(shareLabel.props.minimumFontScale).toBe(0.84);
    expect(shareLabel.props.numberOfLines).toBe(2);
    expect(shareLabelStyle.flexShrink).toBe(1);
    expect(shareLabelStyle.flex).toBeUndefined();
  });

  it('routes the locked trajectory CTA to premium upgrade', () => {
    mockParams.mockReturnValue({
      analysisData: JSON.stringify(makeResult()),
    });

    const { getByTestId } = render(<SuperScanResultScreen />);

    fireEvent.press(getByTestId('trajectory-preview-cta'));

    expect(mockPush).toHaveBeenCalledWith('/premium-upgrade');
  });
});

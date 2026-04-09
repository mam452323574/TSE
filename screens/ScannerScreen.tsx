import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, type CameraPictureOptions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter, useFocusEffect } from 'expo-router';
import { Camera, Image as ImageIcon, Crown, Gift, WifiOff, RefreshCw, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CameraGuide } from '@/components/CameraGuide';
import { NextScanTimer } from '@/components/NextScanTimer';
import { useAllScanEligibility } from '@/hooks/queries';
import { ScanEligibilityResponse, ScanType } from '@/types';
import { SCAN_TYPE_LABELS } from '@/constants/scan';
import { SIZES, SPACING, FONT_WEIGHTS } from '@/constants/theme';
import { ContextualPaywall } from '@/components/ContextualPaywall';
import { paywallSession } from '@/utils/paywallSession';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CameraFlipIcon } from '@/components/CameraFlipIcon';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { PUBLIC_PRIVACY_POLICY_URL } from '@/constants/privacyPolicy';
import {
  buildScanLimitMessage,
  buildScanLimitPaywallTitle,
  formatScanLimitTime,
  getScanLimitUpgradeSubtitle,
} from '@/utils/scanLimitI18n';
import { useScanValidationFeedback } from '@/hooks/useScanValidationFeedback';
import {
  getScanQuotaStatusLabelKey,
  hasScanQuotaPayload,
  resolveScanQuotaState,
} from '@/utils/scanQuotaState';
import { hasPremiumAccess } from '@/utils/subscription';
import { ApiError, isConnectivityApiError } from '@/services/api';

const getCapturePictureOptions = (): CameraPictureOptions => {
  // Keep Expo processing enabled so the saved photo stays deterministic.
  // Reintroducing skipProcessing here previously let a mirror regression slip back in.
  return {
    quality: 1,
  };
};

export default function ScannerScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { scheduleSuperScanReset } = useNotificationContext();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { showAlert, alertElement } = useCustomAlert();
  const { playValidationFeedback } = useScanValidationFeedback();
  const insets = useSafeAreaInsets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  // Use shared React Query hook for scan eligibility (single source of truth)
  const {
    data: scanEligibility,
    errors: scanEligibilityErrors,
    loadingByScanType,
    isAuthReady,
    canQuery: canQueryEligibility,
    hasConnectivityError,
    refetchAll: refetchEligibility,
  } = useAllScanEligibility();

  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedScanType, setSelectedScanType] = useState<ScanType | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showConnectivityBanner, setShowConnectivityBanner] = useState(false);
  const [clearedTimers, setClearedTimers] = useState<Record<string, boolean>>({});
  const [captureSequenceActive, setCaptureSequenceActive] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const captureSequenceActiveRef = useRef(false);
  const gallerySelectionActiveRef = useRef(false);
  const connectivityBannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [paywallConfig, setPaywallConfig] = useState<{
    visible: boolean;
    title: string;
    subtitle?: string;
    description?: string;
    bulletPoints?: string[];
  }>({ visible: false, title: '' });
  const accountTier = userProfile?.account_tier ?? null;
  const isAdmin = accountTier === 'admin';
  const isPremium = hasPremiumAccess(accountTier);

  const interactionsLocked = checkingEligibility || captureSequenceActive;
  const shouldShowConnectivityBanner = showConnectivityBanner || isRetrying;

  useEffect(() => {
    if (hasConnectivityError) {
      if (!connectivityBannerTimeoutRef.current) {
        connectivityBannerTimeoutRef.current = setTimeout(() => {
          setShowConnectivityBanner(true);
          connectivityBannerTimeoutRef.current = null;
        }, 800);
      }
      return;
    }

    if (connectivityBannerTimeoutRef.current) {
      clearTimeout(connectivityBannerTimeoutRef.current);
      connectivityBannerTimeoutRef.current = null;
    }
    setShowConnectivityBanner(false);
  }, [hasConnectivityError]);

  useEffect(() => {
    return () => {
      if (connectivityBannerTimeoutRef.current) {
        clearTimeout(connectivityBannerTimeoutRef.current);
      }
    };
  }, []);

  // Refetch eligibility when screen gains focus (syncs with HomeScreen via shared cache)
  useFocusEffect(
    useCallback(() => {
      if (isAuthReady && canQueryEligibility) {
        void refetchEligibility();
      }
    }, [canQueryEligibility, isAuthReady, refetchEligibility])
  );

  // Manual retry handler for network error banner
  const handleManualRetry = useCallback(() => {
    if (!canQueryEligibility) {
      return;
    }

    setIsRetrying(true);
    void refetchEligibility().finally(() => {
      setIsRetrying(false);
    });
  }, [canQueryEligibility, refetchEligibility]);

  // Handle timer completion dynamically
  const handleTimerComplete = useCallback((scanType: string) => {
    setClearedTimers(prev => {
      if (prev[scanType]) return prev;
      return { ...prev, [scanType]: true };
    });
    if (canQueryEligibility) {
      void refetchEligibility();
    }
  }, [canQueryEligibility, refetchEligibility]);

  const getEligibilityErrorAlertContent = useCallback((error: ApiError) => {
    switch (error.type) {
      case 'AUTH':
        return {
          title: t('scanner.eligibility_error_title'),
          message: t('scanner.eligibility_auth_msg'),
        };
      case 'VALIDATION':
        return {
          title: t('scanner.eligibility_error_title'),
          message:
            error.message.startsWith('api_errors.')
              ? t(error.message)
              : error.message || t('scanner.eligibility_unavailable_msg'),
        };
      case 'DATABASE':
      case 'EDGE_FUNCTION':
      case 'UNKNOWN':
      default:
        return {
          title: t('scanner.eligibility_error_title'),
          message: t('scanner.eligibility_unavailable_msg'),
        };
    }
  }, [t]);

  const showEligibilityErrorAlert = useCallback((error: ApiError) => {
    const { title, message } = getEligibilityErrorAlertContent(error);
    showAlert(
      title,
      message,
      [
        {
          text: t('common.retry'),
          onPress: () => {
            if (canQueryEligibility) {
              void refetchEligibility();
            }
          },
        },
        { text: t('common.ok'), style: 'cancel' },
      ],
      undefined,
      { variant: 'warning', emoji: '\u26A0\uFE0F' }
    );
  }, [canQueryEligibility, getEligibilityErrorAlertContent, refetchEligibility, showAlert, t]);

  const normalizeCapturedPhotoUri = useCallback(async (photoUri: string, cameraFacing: CameraType) => {
    if (cameraFacing !== 'front') {
      return photoUri;
    }

    const normalizedPhoto = await ImageManipulator.manipulateAsync(
      photoUri,
      [{ flip: ImageManipulator.FlipType.Horizontal }],
      {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return normalizedPhoto.uri;
  }, []);

  const openScanPreview = useCallback(
    async (scanType: ScanType, imageUri: string) => {
      if (scanType === 'super') {
        await scheduleSuperScanReset();
      }

      router.push({
        pathname: '/scan-preview',
        params: {
          imageUri,
          scanType,
        },
      });
    },
    [router, scheduleSuperScanReset]
  );

  const getTimedLimitContent = useCallback(
    (eligibility: Pick<ScanEligibilityResponse, 'message' | 'message_key' | 'next_available_date'>) => {
      if (!eligibility.next_available_date) {
        return null;
      }

      const timeMessage = formatScanLimitTime(eligibility.next_available_date, t);

      return {
        timeMessage,
        message: buildScanLimitMessage(eligibility, t, timeMessage),
        paywallTitle: buildScanLimitPaywallTitle(t, timeMessage),
        paywallSubtitle: getScanLimitUpgradeSubtitle(t),
      };
    },
    [t]
  );

  const handleScanTypeSelect = async (scanType: ScanType) => {
    if (interactionsLocked || captureSequenceActiveRef.current) {
      return;
    }

    // Unified logic for every scan type, including Super Scan.
    const eligibility = scanEligibility?.[scanType];
    const eligibilityError = scanEligibilityErrors[scanType];

    if (!eligibility) {
      if (loadingByScanType[scanType]) {
        return;
      }

      if (eligibilityError && !isConnectivityApiError(eligibilityError)) {
        showEligibilityErrorAlert(eligibilityError);
      }
      return;
    }

    const welcomeCredits = eligibility?.welcome_credits || 0;
    const hasWelcomeCredits = welcomeCredits > 0;
    const isTimerFinished = eligibility?.next_available_date
      ? Date.now() >= eligibility.next_available_date
      : false;
    const hasTimerCleared = clearedTimers[scanType] || isTimerFinished;

    if (!isAdmin && (!eligibility || (!eligibility.allowed && !hasWelcomeCredits && !hasTimerCleared))) {
      // Special case for Premium-only Super Scan (no next_available_date).
      if (scanType === 'super' && eligibility && !eligibility.next_available_date) {
        const premiumTitle = t('super_scan_features.premium_alert_title');
        const premiumMessage = t('super_scan_features.premium_alert_msg');
        if (paywallSession.canShowPaywall()) {
          setPaywallConfig({
            visible: true,
            title: premiumTitle,
            description: premiumMessage,
          });
          paywallSession.markPaywallShown();
        } else {
          showAlert(
            premiumTitle,
            premiumMessage,
            [
              { text: t('common.later'), style: 'cancel' },
              {
                text: t('premium.upgrade_title'),
                onPress: () => router.push('/premium-upgrade'),
              },
            ],
            undefined,
            { variant: 'premium', emoji: '\u2728' }
          );
        }
        return;
      }

      // Cas avec next_available_date (limite atteinte)
      if (eligibility && eligibility.next_available_date) {
        const limitContent = getTimedLimitContent(eligibility);
        if (!limitContent) {
          return;
        }

        // Dedicated message when Super Scan has already been used today.
        if (scanType === 'super') {
          showAlert(
            t('super_scan_features.used_alert_title'),
            `${t('super_scan_features.used_alert_msg')}\n\n${limitContent.timeMessage}`,
            [{ text: t('common.ok'), style: 'default' }],
            undefined,
            { variant: 'warning', emoji: '\uD83D\uDD52' }
          );
        } else {
          if (paywallSession.canShowPaywall()) {
            setPaywallConfig({
              visible: true,
              title: limitContent.paywallTitle,
              subtitle: limitContent.paywallSubtitle,
            });
            paywallSession.markPaywallShown();
          } else {
            showAlert(
              t('common.error'),
              `${limitContent.message}\n\n${limitContent.paywallSubtitle}`,
              [
                { text: t('common.ok'), style: 'cancel' },
                {
                  text: t('premium.upgrade_title'),
                  onPress: () => router.push('/premium-upgrade'),
                },
              ],
              undefined,
              { variant: 'premium', emoji: '\u2728' }
            );
          }
        }
      }
      return;
    }

    setSelectedScanType(scanType);
  };

  const performCameraCapture = useCallback(
    async (scanType: ScanType) => {
      if (!cameraRef.current) {
        return false;
      }

      const captureFacing = facing;
      const photo = await cameraRef.current.takePictureAsync(getCapturePictureOptions());

      if (!photo) {
        return false;
      }

      const normalizedPhotoUri = await normalizeCapturedPhotoUri(photo.uri, captureFacing);

      await openScanPreview(scanType, normalizedPhotoUri);

      return true;
    },
    [facing, normalizeCapturedPhotoUri, openScanPreview]
  );

  const takePicture = async () => {
    if (interactionsLocked || captureSequenceActiveRef.current) {
      return;
    }

    if (!selectedScanType) {
      showAlert(
        t('scanner.type_required_title'),
        t('scanner.type_required_msg'),
        undefined,
        undefined,
        { variant: 'info', emoji: '\uD83D\uDCF8' }
      );
      return;
    }

    // Unified eligibility check for every scan type.
    const eligibility = scanEligibility?.[selectedScanType];
    const hasWelcomeCredits = (eligibility?.welcome_credits || 0) > 0;
    const isTimerFinished = eligibility?.next_available_date
      ? Date.now() >= eligibility.next_available_date
      : false;
    const hasTimerCleared = clearedTimers[selectedScanType] || isTimerFinished;
    const canScan = isAdmin || eligibility?.allowed || hasWelcomeCredits || hasTimerCleared;
    const isSuperPremiumOnly = selectedScanType === 'super' && eligibility && !eligibility.next_available_date;
    const limitContent = eligibility ? getTimedLimitContent(eligibility) : null;

    if (!canScan) {
      if (paywallSession.canShowPaywall()) {
        const titleText = isSuperPremiumOnly
          ? t('super_scan_features.premium_alert_title')
          : limitContent?.paywallTitle || t('scan_limit.limit_reached');
        const subtitleText = isSuperPremiumOnly
          ? undefined
          : limitContent?.paywallSubtitle || getScanLimitUpgradeSubtitle(t);
        const descriptionText = isSuperPremiumOnly
          ? t('super_scan_features.premium_alert_msg')
          : undefined;

        setPaywallConfig({
          visible: true,
          title: titleText,
          subtitle: subtitleText,
          description: descriptionText,
        });
        paywallSession.markPaywallShown();
      } else {
        showAlert(
          t('scan_limit.limit_reached'),
          isSuperPremiumOnly
            ? t('super_scan_features.premium_alert_msg')
            : limitContent?.message || eligibility?.message || t('scan_limit.limit_reached'),
          [
            { text: t('common.ok'), style: 'cancel' },
            {
              text: t('premium.upgrade_btn'),
              onPress: () => router.push('/premium-upgrade'),
            },
          ],
          undefined,
          { variant: 'premium', emoji: '\u2728' }
        );
      }
      return;
    }

    captureSequenceActiveRef.current = true;
    setCaptureSequenceActive(true);
    setCheckingEligibility(true);

    try {
      await playValidationFeedback();
      const didNavigate = await performCameraCapture(selectedScanType);

      if (!didNavigate) {
        throw new Error('CAPTURE_FAILED');
      }
    } catch (error) {
      showAlert(
        t('common.error'),
        t('scanner.error_taking_photo'),
        undefined,
        undefined,
        { variant: 'warning', emoji: '\uD83D\uDCF7' }
      );
    } finally {
      setCheckingEligibility(false);
      captureSequenceActiveRef.current = false;
      setCaptureSequenceActive(false);
    }
  };

  const pickImage = async () => {
    if (
      interactionsLocked ||
      captureSequenceActiveRef.current ||
      gallerySelectionActiveRef.current
    ) {
      return;
    }

    if (!selectedScanType) {
      showAlert(
        t('scanner.type_required_title'),
        t('scanner.type_required_msg'),
        undefined,
        undefined,
        { variant: 'info', emoji: '\uD83D\uDDBC\uFE0F' }
      );
      return;
    }

    // Unified eligibility check for every scan type.
    const eligibility = scanEligibility?.[selectedScanType];
    const hasWelcomeCredits = (eligibility?.welcome_credits || 0) > 0;
    const isTimerFinished = eligibility?.next_available_date
      ? Date.now() >= eligibility.next_available_date
      : false;
    const hasTimerCleared = clearedTimers[selectedScanType] || isTimerFinished;
    const canScan = isAdmin || eligibility?.allowed || hasWelcomeCredits || hasTimerCleared;
    const isSuperPremiumOnly = selectedScanType === 'super' && eligibility && !eligibility.next_available_date;
    const limitContent = eligibility ? getTimedLimitContent(eligibility) : null;

    if (!canScan) {
      if (paywallSession.canShowPaywall()) {
        const titleText = isSuperPremiumOnly
          ? t('super_scan_features.premium_alert_title')
          : limitContent?.paywallTitle || t('scan_limit.limit_reached');
        const subtitleText = isSuperPremiumOnly
          ? undefined
          : limitContent?.paywallSubtitle || getScanLimitUpgradeSubtitle(t);
        const descriptionText = isSuperPremiumOnly
          ? t('super_scan_features.premium_alert_msg')
          : undefined;

        setPaywallConfig({
          visible: true,
          title: titleText,
          subtitle: subtitleText,
          description: descriptionText,
        });
        paywallSession.markPaywallShown();
      } else {
        showAlert(
          t('scan_limit.limit_reached'),
          isSuperPremiumOnly
            ? t('super_scan_features.premium_alert_msg')
            : limitContent?.message || eligibility?.message || t('scan_limit.limit_reached'),
          [
            { text: t('common.ok'), style: 'cancel' },
            {
              text: t('premium.upgrade_btn'),
              onPress: () => router.push('/premium-upgrade'),
            },
          ],
          undefined,
          { variant: 'premium', emoji: '\u2728' }
        );
      }
      return;
    }

    gallerySelectionActiveRef.current = true;
    setCheckingEligibility(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        await openScanPreview(selectedScanType, result.assets[0].uri);
      }
    } catch (error) {
      showAlert(
        t('common.error'),
        t('scanner.error_loading_image'),
        undefined,
        undefined,
        { variant: 'warning', emoji: '\uD83D\uDDBC\uFE0F' }
      );
    } finally {
      setCheckingEligibility(false);
      gallerySelectionActiveRef.current = false;
    }
  };

  const toggleCameraFacing = () => {
    if (interactionsLocked || captureSequenceActiveRef.current) {
      return;
    }

    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const renderScanTypeButton = (scanType: ScanType) => {
    const isSelected = selectedScanType === scanType;
    const eligibility = scanEligibility?.[scanType];
    const quotaState = resolveScanQuotaState({
      scanType,
      accountTier,
      eligibility,
      error: scanEligibilityErrors[scanType],
      loading: loadingByScanType[scanType],
      isAuthReady,
      canQuery: canQueryEligibility,
    });
    const welcomeCredits = eligibility?.welcome_credits || 0;
    const hasWelcomeCredits = welcomeCredits > 0;
    const quotaStateLabelKey = getScanQuotaStatusLabelKey(quotaState);
    const nextAvailableDate = hasScanQuotaPayload(quotaState)
      ? quotaState.nextAvailableDate
      : eligibility?.next_available_date;
    const isTimerFinished = nextAvailableDate
      ? Date.now() >= nextAvailableDate
      : false;
    const hasTimerCleared = clearedTimers[scanType] || isTimerFinished;
    // Admin buttons are never disabled
    const isDisabled = isAdmin ? false : (eligibility ? (!eligibility.allowed && !hasWelcomeCredits && !hasTimerCleared) : true);
    const showInlineTimer =
      isDisabled &&
      !!nextAvailableDate &&
      !hasWelcomeCredits &&
      !hasTimerCleared;
    // Check if admin has remaining scans
    const adminHasScans =
      isAdmin && hasScanQuotaPayload(quotaState) ? quotaState.remaining > 0 : false;

    return (
      <View key={scanType} style={styles.scanTypeContainer}>
        <TouchableOpacity
          style={[
            styles.scanTypeButton,
            isSelected && styles.scanTypeButtonSelected,
            isDisabled && styles.scanTypeButtonDisabled,
            hasWelcomeCredits && !isAdmin && styles.scanTypeButtonWelcome,
            isAdmin && !isSelected && adminHasScans && styles.scanTypeButtonAdmin,
          ]}
          onPress={() => handleScanTypeSelect(scanType)}
          disabled={interactionsLocked}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.scanTypeText, isSelected && styles.scanTypeTextSelected]}
            numberOfLines={1}
          >
            {t(SCAN_TYPE_LABELS[scanType])}
          </Text>
          <View style={styles.scanTypeSecondarySlot}>
            {hasWelcomeCredits && !isAdmin ? (
              <View style={styles.welcomeCreditsContainer} testID="welcome-gift">
                <Gift color={colors.success} size={12} strokeWidth={2} />
              </View>
            ) : showInlineTimer ? (
              <NextScanTimer
                nextAvailableDate={nextAvailableDate!}
                scanLabel="Dispo."
                mode="scannerCompact"
                onTimerComplete={() => handleTimerComplete(scanType)}
              />
            ) : (
              <View style={styles.scanTypeSecondarySpacer} />
            )}
          </View>
          <View style={styles.scanTypeFooterSlot}>
            <Text style={styles.countLabel}>
              {hasScanQuotaPayload(quotaState)
                ? `${quotaState.remaining}/${quotaState.limit}`
                : t(quotaStateLabelKey ?? 'scan_limit.missing_payload')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSuperScanButton = () => {
    const isSelected = selectedScanType === 'super';
    const superEligibility = scanEligibility?.['super'];
    const superQuotaState = resolveScanQuotaState({
      scanType: 'super',
      accountTier,
      eligibility: superEligibility,
      error: scanEligibilityErrors.super,
      loading: loadingByScanType.super,
      isAuthReady,
      canQuery: canQueryEligibility,
    });
    const superQuotaStateLabelKey = getScanQuotaStatusLabelKey(superQuotaState);

    const isTimerFinished = superEligibility?.next_available_date
      ? Date.now() >= superEligibility.next_available_date
      : false;
    const hasTimerCleared = clearedTimers['super'] || isTimerFinished;
    const superScanUsed = superEligibility ? !superEligibility.allowed : false;
    // Admin buttons are never disabled
    const isDisabled = isAdmin ? false : (isPremium && superScanUsed && !hasTimerCleared);

    return (
      <View style={styles.scanTypeContainer}>
        <TouchableOpacity
          style={[
            styles.scanTypeButton,
            styles.superScanButton,
            isSelected && styles.superScanButtonSelected,
            isDisabled && styles.scanTypeButtonDisabled,
          ]}
          onPress={() => handleScanTypeSelect('super')}
          disabled={interactionsLocked}
          activeOpacity={0.8}
        >
          <View style={styles.superScanHeader}>
            <Sparkles color={isSelected ? '#FFFFFF' : '#FFD700'} size={12} strokeWidth={2} />
            <Text
              style={[styles.superScanText, isSelected && styles.scanTypeTextSelected]}
              numberOfLines={1}
            >
              Super
            </Text>
          </View>
          <View style={styles.scanTypeSecondarySlot}>
            {!isPremium ? (
              <View style={styles.premiumBadge}>
                <Crown color="#FFD700" size={8} fill="#FFD700" />
                <Text style={styles.premiumBadgeText}>{t('super_scan_features.premium_badge')}</Text>
              </View>
            ) : (
              <View style={styles.scanTypeSecondarySpacer} />
            )}
          </View>
          <View style={styles.scanTypeFooterSlot}>
            {isPremium ? (
              <Text style={styles.superScanLimit}>
                {hasScanQuotaPayload(superQuotaState)
                  ? `${superQuotaState.remaining}/${superQuotaState.limit}`
                  : t(superQuotaStateLabelKey ?? 'scan_limit.missing_payload')}
              </Text>
            ) : (
              <View style={styles.scanTypeFooterSpacer} />
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (!permission) {
    return <LoadingSpinner />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Camera color={colors.primary} size={64} />
          <Text style={styles.permissionTitle}>{t('scanner.camera_permission_msg')}</Text>
          <Text style={styles.permissionText}>{t('scanner.camera_permission_detail')}</Text>
          <Text style={styles.permissionSubtext}>{t('scanner.camera_permission_backend')}</Text>
          <Text style={styles.permissionUrl}>{PUBLIC_PRIVACY_POLICY_URL}</Text>
          <View style={styles.permissionButtonStack}>
            <View style={styles.permissionButtonWrapper}>
              <Button
                title={t('settings.privacy_policy')}
                onPress={() => router.push('/privacy-policy')}
                variant="outline"
              />
            </View>
            <View style={styles.permissionButtonWrapper}>
              <Button title={t('scanner.authorize_camera')} onPress={requestPermission} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {alertElement}

      <View style={{ flex: 1 }}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          autofocus={captureSequenceActive ? 'on' : 'off'}
          animateShutter={false}
          mirror={false}
          testID="scanner-camera-view"
        />

        <View style={styles.cameraInteractionLayer} pointerEvents="none" testID="scanner-focus-overlay">
          <CameraGuide scanType={selectedScanType} visible={!!selectedScanType} />
        </View>

        {/* Header removed on request */}

        {/* Network error banner */}
        {shouldShowConnectivityBanner && (
          <TouchableOpacity
            style={styles.networkErrorBanner}
            onPress={handleManualRetry}
            disabled={isRetrying}
            activeOpacity={0.8}
          >
            {isRetrying ? (
              <RefreshCw color={colors.warning} size={18} strokeWidth={2} />
            ) : (
              <WifiOff color={colors.warning} size={18} strokeWidth={2} />
            )}
            <Text style={styles.networkErrorText}>
              {isRetrying ? t('super_scan_features.connection_reconnecting') : t('super_scan_features.connection_unstable')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Scan type selector moved to the bottom */}
        <View style={styles.scanTypeSelector}>
          {renderScanTypeButton('health')}
          {renderScanTypeButton('body')}
          {renderScanTypeButton('nutrition')}
          {renderSuperScanButton()}
        </View>

        {/* Transparent floating controls */}
        <View style={styles.controlsOverlay}>
          <TouchableOpacity
            style={styles.sideButton}
            onPress={pickImage}
            activeOpacity={0.7}
            disabled={interactionsLocked}
            testID="scanner-gallery-button"
          >
            <ImageIcon color="#FFFFFF" size={26} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            activeOpacity={0.8}
            disabled={interactionsLocked}
            testID="scanner-capture-button"
          >
            <View style={styles.captureButtonOuter}>
              <View style={styles.captureButtonInner} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideButton}
            onPress={toggleCameraFacing}
            activeOpacity={0.7}
            disabled={interactionsLocked}
            testID="scanner-flip-camera-button"
          >
            <CameraFlipIcon size={30} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ContextualPaywall
        visible={paywallConfig.visible}
        onClose={() => setPaywallConfig(prev => ({ ...prev, visible: false }))}
        title={paywallConfig.title}
        subtitle={paywallConfig.subtitle}
        description={paywallConfig.description}
        bulletPoints={paywallConfig.bulletPoints}
        primaryButtonText="Voir les offres"
      />
    </View>
  );
}

const createStyles = (colors: any, insets: any) => StyleSheet.create({
  // === CONTAINER PRINCIPAL ===
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.page,
    backgroundColor: colors.background,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  permissionTitle: {
    fontSize: SIZES.text20,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
    textAlign: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  permissionText: {
    fontSize: SIZES.text16,
    color: colors.primaryText,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  permissionSubtext: {
    fontSize: SIZES.text14,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  permissionUrl: {
    fontSize: SIZES.text12,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  permissionButtonStack: {
    width: '100%',
    gap: SPACING.sm,
  },
  permissionButtonWrapper: {
    width: '100%',
  },

  // === FULLSCREEN CAMERA ===
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraInteractionLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  // === HEADER FLOTTANT ===
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: SPACING.page,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  cameraTitle: {
    fontSize: SIZES.text20,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // === SCAN TYPE SELECTOR ===
  scanTypeSelector: {
    position: 'absolute',
    bottom: insets.bottom + 112,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 4,
    paddingHorizontal: SPACING.sm,
  },
  scanTypeContainer: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    maxWidth: 84,
  },
  scanTypeButton: {
    width: '100%',
    height: 58,
    paddingVertical: 2,
    paddingHorizontal: 3,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  scanTypeButtonSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    borderColor: 'rgba(0, 122, 255, 0.95)',
  },
  scanTypeButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.24)',
    opacity: 1,
  },
  scanTypeButtonWelcome: {
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: 'rgba(34, 197, 94, 0.4)',
  },
  scanTypeButtonAdmin: {
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.8)',
    backgroundColor: 'rgba(0, 122, 255, 0.35)',
  },
  scanTypeText: {
    fontSize: SIZES.text10,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 11,
    width: '100%',
  },
  scanTypeTextSelected: {
    color: colors.white,
  },
  scanTypeSecondarySlot: {
    minHeight: 9,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTypeSecondarySpacer: {
    height: 9,
    width: '100%',
  },
  scanTypeFooterSlot: {
    minHeight: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  scanTypeFooterSpacer: {
    height: 10,
    width: '100%',
  },
  countLabel: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
    lineHeight: 10,
  },
  welcomeCreditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  welcomeCreditsLabel: {
    fontSize: SIZES.text10,
    color: colors.success,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // === SUPER SCAN BUTTON ===
  superScanButton: {
    borderWidth: 2,
    borderColor: 'rgba(255, 200, 0, 0.8)',
    backgroundColor: 'rgba(255, 180, 0, 0.45)',
  },
  superScanButtonSelected: {
    backgroundColor: 'rgba(255, 180, 0, 0.95)',
    borderColor: 'rgba(255, 200, 0, 1)',
  },
  superScanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
  },
  superScanText: {
    fontSize: SIZES.text10,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 11,
  },
  superScanLimit: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 10,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    gap: 2,
  },
  premiumBadgeText: {
    fontSize: 7,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
  },


  // === BANNERS ===
  networkErrorBanner: {
    position: 'absolute',
    top: insets.top + 96,
    left: SPACING.page,
    right: SPACING.page,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  networkErrorText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: FONT_WEIGHTS.semiBold,
    flex: 1,
    textAlign: 'center',
  },

  // === FLOATING CONTROLS ===
  controlsOverlay: {
    position: 'absolute',
    bottom: insets.bottom + SPACING.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    gap: 40,
  },
  sideButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
});

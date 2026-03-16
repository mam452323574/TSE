import { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useFocusEffect } from 'expo-router';
import { Camera, RefreshCcw, Image as ImageIcon, Crown, Gift, WifiOff, RefreshCw, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CameraGuide } from '@/components/CameraGuide';
import { NextScanTimer } from '@/components/NextScanTimer';
import { useAllScanEligibility } from '@/hooks/queries';
import { ScanType } from '@/types';
import { SCAN_TYPE_LABELS, FREE_SCAN_LIMITS, PREMIUM_SCAN_LIMITS } from '@/constants/scan';
import { COLORS, SIZES, SPACING, FONT_WEIGHTS } from '@/constants/theme';
import { ContextualPaywall } from '@/components/ContextualPaywall';
import { paywallSession } from '@/utils/paywallSession';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CameraFlipIcon } from '@/components/CameraFlipIcon';
import { useCustomAlert } from '@/hooks/useCustomAlert';

export default function ScannerScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { scheduleSuperScanReset } = useNotificationContext();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { showAlert, alertElement } = useCustomAlert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Use shared React Query hook for scan eligibility (single source of truth)
  const {
    data: scanEligibility,
    isLoading: eligibilityLoading,
    isError: hasQueryError,
    refetchAll: refetchEligibility,
  } = useAllScanEligibility();

  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedScanType, setSelectedScanType] = useState<ScanType | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [clearedTimers, setClearedTimers] = useState<Record<string, boolean>>({});
  const cameraRef = useRef<CameraView>(null);

  const [paywallConfig, setPaywallConfig] = useState<{
    visible: boolean;
    title: string;
    subtitle?: string;
    description?: string;
    bulletPoints?: string[];
  }>({ visible: false, title: '' });

  // Derive loading and network error states from React Query
  const loading = eligibilityLoading;
  const networkError = hasQueryError;

  // Refetch eligibility when screen gains focus (syncs with HomeScreen via shared cache)
  useFocusEffect(
    useCallback(() => {
      if (!eligibilityLoading) {
        refetchEligibility();
      }
    }, [eligibilityLoading, refetchEligibility])
  );

  // Manual retry handler for network error banner
  const handleManualRetry = useCallback(() => {
    setIsRetrying(true);
    refetchEligibility();
    // Reset retrying state after a short delay
    setTimeout(() => setIsRetrying(false), 1000);
  }, [refetchEligibility]);

  // Handle timer completion dynamically
  const handleTimerComplete = useCallback((scanType: string) => {
    setClearedTimers(prev => {
      if (prev[scanType]) return prev;
      return { ...prev, [scanType]: true };
    });
    refetchEligibility();
  }, [refetchEligibility]);

  const handleScanTypeSelect = async (scanType: ScanType) => {
    const isAdmin = userProfile?.account_tier === 'admin';
    // Logique unifiée pour tous les types de scan (y compris super)
    const eligibility = scanEligibility?.[scanType];
    const welcomeCredits = eligibility?.welcome_credits || 0;
    const hasWelcomeCredits = welcomeCredits > 0;
    const isTimerFinished = eligibility?.next_available_date
      ? Date.now() >= eligibility.next_available_date
      : false;
    const hasTimerCleared = clearedTimers[scanType] || isTimerFinished;

    if (!isAdmin && (!eligibility || (!eligibility.allowed && !hasWelcomeCredits && !hasTimerCleared))) {
      // Cas spécial pour Super Scan premium-only (pas de next_available_date)
      if (scanType === 'super' && eligibility && !eligibility.next_available_date) {
        if (paywallSession.canShowPaywall()) {
          setPaywallConfig({
            visible: true,
            title: t('super_scan_features.premium_alert_title', 'Le Super Scan est réservé aux membres Premium'),
            description: t('super_scan_features.premium_alert_msg', 'Analyse approfondie IA • Score de risque global • Détection de conditions'),
          });
          paywallSession.markPaywallShown();
        } else {
          showAlert(
            t('super_scan_features.premium_alert_title'),
            t('super_scan_features.premium_alert_msg'),
            [
              { text: t('common.later'), style: 'cancel' },
              {
                text: t('premium.upgrade_title'),
                onPress: () => router.push('/premium-upgrade'),
              },
            ]
          );
        }
        return;
      }

      // Cas avec next_available_date (limite atteinte)
      if (eligibility && eligibility.next_available_date) {
        const nextDate = new Date(eligibility.next_available_date);
        const now = new Date();
        const diffMs = nextDate.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        let timeMessage = '';
        if (diffDays > 0) {
          timeMessage = `${diffDays} ${diffDays > 1 ? t('common.days') : t('common.day')}`;
        } else if (diffHours > 0) {
          timeMessage = `${diffHours} ${diffHours > 1 ? t('common.hours') : t('common.hour')}`;
        } else {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          timeMessage = `${diffMinutes} ${diffMinutes > 1 ? t('common.minutes') : t('common.minute')}`;
        }

        // Message spécifique pour Super Scan utilisé aujourd'hui
        if (scanType === 'super') {
          showAlert(
            t('super_scan_features.used_alert_title'),
            `${t('super_scan_features.used_alert_msg')}\n\n${timeMessage}`,
            [{ text: t('common.ok'), style: 'default' }]
          );
        } else {
          if (paywallSession.canShowPaywall()) {
            setPaywallConfig({
              visible: true,
              title: `Votre prochain scan est disponible dans ${timeMessage}`,
              subtitle: 'Passez en Premium pour scanner sans limite',
            });
            paywallSession.markPaywallShown();
          } else {
            showAlert(
              t('common.error'),
              `${t(eligibility.message || 'scan_limit.limit_reached')} ${timeMessage}\n\n${t('premium.subtitle')}`,
              [
                { text: t('common.ok'), style: 'cancel' },
                {
                  text: t('premium.upgrade_title'),
                  onPress: () => router.push('/premium-upgrade'),
                },
              ]
            );
          }
        }
      }
      return;
    }

    setSelectedScanType(scanType);
  };

  const takePicture = async () => {
    if (!selectedScanType) {
      showAlert(t('scanner.type_required_title'), t('scanner.type_required_msg'));
      return;
    }

    const isAdmin = userProfile?.account_tier === 'admin';
    // Vérification unifiée pour tous les types de scan
    const eligibility = scanEligibility?.[selectedScanType];
    const hasWelcomeCredits = (eligibility?.welcome_credits || 0) > 0;
    const isTimerFinished = eligibility?.next_available_date
      ? Date.now() >= eligibility.next_available_date
      : false;
    const hasTimerCleared = clearedTimers[selectedScanType] || isTimerFinished;
    const canScan = isAdmin || eligibility?.allowed || hasWelcomeCredits || hasTimerCleared;

    if (!canScan) {
      if (paywallSession.canShowPaywall()) {
        const timeMessage = eligibility?.next_available_date 
          ? ` dans quelques temps` 
          : '';
        const titleText = selectedScanType === 'super' 
          ? t('super_scan_features.premium_alert_title', 'Le Super Scan est réservé aux membres Premium')
          : `Votre prochain scan est disponible${timeMessage}`;
        const subtitleText = selectedScanType === 'super'
          ? undefined
          : 'Passez en Premium pour scanner sans limite';
        const descriptionText = selectedScanType === 'super'
          ? t('super_scan_features.premium_alert_msg', 'Analyse approfondie IA • Score de risque global • Détection de conditions')
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
          t(eligibility?.message || 'scan_limit.limit_reached'),
          [
            { text: t('common.ok'), style: 'cancel' },
            {
              text: t('premium.upgrade_btn'),
              onPress: () => router.push('/premium-upgrade'),
            },
          ]
        );
      }
      return;
    }

    setCheckingEligibility(true);
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          skipProcessing: true, // Force l'image brute pour éviter les artefacts de traitement
        });
        if (photo) {
          // Planifier la notification de reset pour Super Scan
          if (selectedScanType === 'super') {
            await scheduleSuperScanReset();
          }

          router.push({
            pathname: '/scan-preview',
            params: {
              imageUri: photo.uri,
              scanType: selectedScanType,
            },
          });
        }
      }
    } catch (error) {
      showAlert(t('common.error'), t('scanner.error_taking_photo'));
    } finally {
      setCheckingEligibility(false);
    }
  };

  const pickImage = async () => {
    if (!selectedScanType) {
      showAlert(t('scanner.type_required_title'), t('scanner.type_required_msg'));
      return;
    }

    const isAdmin = userProfile?.account_tier === 'admin';
    // Vérification unifiée pour tous les types de scan
    const eligibility = scanEligibility?.[selectedScanType];
    const hasWelcomeCredits = (eligibility?.welcome_credits || 0) > 0;
    const isTimerFinished = eligibility?.next_available_date
      ? Date.now() >= eligibility.next_available_date
      : false;
    const hasTimerCleared = clearedTimers[selectedScanType] || isTimerFinished;
    const canScan = isAdmin || eligibility?.allowed || hasWelcomeCredits || hasTimerCleared;

    if (!canScan) {
      if (paywallSession.canShowPaywall()) {
        const timeMessage = eligibility?.next_available_date 
          ? ` dans quelques temps` 
          : '';
        const titleText = selectedScanType === 'super' 
          ? t('super_scan_features.premium_alert_title', 'Le Super Scan est réservé aux membres Premium')
          : `Votre prochain scan est disponible${timeMessage}`;
        const subtitleText = selectedScanType === 'super'
          ? undefined
          : 'Passez en Premium pour scanner sans limite';
        const descriptionText = selectedScanType === 'super'
          ? t('super_scan_features.premium_alert_msg', 'Analyse approfondie IA • Score de risque global • Détection de conditions')
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
          t(eligibility?.message || 'scan_limit.limit_reached'),
          [
            { text: t('common.ok'), style: 'cancel' },
            {
              text: t('premium.upgrade_btn'),
              onPress: () => router.push('/premium-upgrade'),
            },
          ]
        );
      }
      return;
    }

    setCheckingEligibility(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        // Planifier la notification de reset pour Super Scan
        if (selectedScanType === 'super') {
          await scheduleSuperScanReset();
        }

        router.push({
          pathname: '/scan-preview',
          params: {
            imageUri: result.assets[0].uri,
            scanType: selectedScanType,
          },
        });
      }
    } catch (error) {
      showAlert(t('common.error'), t('scanner.error_loading_image'));
    } finally {
      setCheckingEligibility(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const renderScanTypeButton = (scanType: ScanType) => {
    const isSelected = selectedScanType === scanType;
    const eligibility = scanEligibility?.[scanType];
    const welcomeCredits = eligibility?.welcome_credits || 0;
    const hasWelcomeCredits = welcomeCredits > 0;
    const isTimerFinished = eligibility?.next_available_date
      ? Date.now() >= eligibility.next_available_date
      : false;
    const hasTimerCleared = clearedTimers[scanType] || isTimerFinished;
    const isAdmin = userProfile?.account_tier === 'admin';
    const isPremium = userProfile?.account_tier === 'premium' || isAdmin;
    // Admin buttons are never disabled
    const isDisabled = isAdmin ? false : (eligibility ? (!eligibility.allowed && !hasWelcomeCredits && !hasTimerCleared) : true);
    const limits = isPremium ? PREMIUM_SCAN_LIMITS : FREE_SCAN_LIMITS;
    const limit = limits[scanType];
    // Check if admin has remaining scans
    const adminHasScans = isAdmin ? (!eligibility || ((eligibility.limit || 20) - (eligibility.current_count || 0) > 0)) : false;

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
          disabled={false}
          activeOpacity={0.8}
        >
          <Text style={[styles.scanTypeText, isSelected && styles.scanTypeTextSelected]}>
            {t(SCAN_TYPE_LABELS[scanType])}
          </Text>
          {hasWelcomeCredits && !isAdmin ? (
            <View style={styles.welcomeCreditsContainer} testID="welcome-gift">
              <Gift color={colors.success} size={14} strokeWidth={2} />
            </View>
          ) : (
            <>
              {!isPremium && <Text style={styles.limitLabel}>{t(limit.label)}</Text>}
              {eligibility && (
                <Text style={styles.countLabel}>
                  {Math.max(0, (eligibility.limit || limit.count) - (eligibility.current_count || 0))}/{eligibility.limit || limit.count}
                </Text>
              )}
            </>
          )}
        </TouchableOpacity>
        {isDisabled && eligibility?.next_available_date && !hasWelcomeCredits && !hasTimerCleared && (
          <NextScanTimer
            nextAvailableDate={eligibility.next_available_date}
            scanLabel="Disponible"
            onTimerComplete={() => handleTimerComplete(scanType)}
          />
        )}
      </View>
    );
  };

  const renderSuperScanButton = () => {
    const isSelected = selectedScanType === 'super';
    const isAdmin = userProfile?.account_tier === 'admin';
    const isPremium = userProfile?.account_tier === 'premium' || isAdmin;
    const superEligibility = scanEligibility?.['super'];

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
          disabled={false}
          activeOpacity={0.8}
        >
          <View style={styles.superScanHeader}>
            <Sparkles color={isSelected ? '#FFFFFF' : '#FFD700'} size={14} strokeWidth={2} />
            <Text style={[styles.superScanText, isSelected && styles.scanTypeTextSelected]}>
              Super
            </Text>
          </View>
          {isPremium ? (
            <Text style={styles.superScanLimit}>
              {isAdmin ? '∞' : (superScanUsed ? '0/1' : '1/1')}
            </Text>
          ) : (
            <View style={styles.premiumBadge}>
              <Crown color="#FFD700" size={10} fill="#FFD700" />
              <Text style={styles.premiumBadgeText}>{t('super_scan_features.premium_badge')}</Text>
            </View>
          )}
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
        <Camera color={colors.primary} size={64} />
        <Text style={styles.permissionText}>{t('scanner.camera_permission_msg')}</Text>
        <Button title={t('scanner.authorize_camera')} onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {alertElement}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={{ flex: 1 }}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

        {/* Header supprimé par demande utilisateur */}

        {/* Bannière erreur réseau */}
        {networkError && (
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

        <CameraGuide scanType={selectedScanType} />

        {/* Sélecteur de type de scan - déplacé en bas */}
        <View style={styles.scanTypeSelector}>
          {renderScanTypeButton('health')}
          {renderScanTypeButton('body')}
          {renderScanTypeButton('nutrition')}
          {renderSuperScanButton()}
        </View>

        {/* Contrôles flottants transparents */}
        <View style={styles.controlsOverlay}>
          <TouchableOpacity
            style={styles.sideButton}
            onPress={pickImage}
            activeOpacity={0.7}
            disabled={checkingEligibility}
          >
            <ImageIcon color="#FFFFFF" size={26} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            activeOpacity={0.8}
            disabled={checkingEligibility}
          >
            <View style={styles.captureButtonOuter}>
              <View style={styles.captureButtonInner} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideButton}
            onPress={toggleCameraFacing}
            activeOpacity={0.7}
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

const createStyles = (colors: any) => StyleSheet.create({
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
  permissionText: {
    fontSize: SIZES.text16,
    color: colors.primaryText,
    textAlign: 'center',
    marginVertical: SPACING.xl,
  },

  // === CAMERA PLEIN ÉCRAN ===
  camera: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
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

  // === SÉLECTEUR DE TYPE DE SCAN ===
  scanTypeSelector: {
    position: 'absolute',
    bottom: 130,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  scanTypeContainer: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 90,
  },
  scanTypeButton: {
    width: '100%',
    minHeight: 60,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTypeButtonSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    borderColor: 'rgba(0, 122, 255, 0.95)',
  },
  scanTypeButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.6,
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
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scanTypeTextSelected: {
    color: colors.white,
  },
  limitLabel: {
    fontSize: SIZES.text10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  countLabel: {
    fontSize: SIZES.text12,
    color: '#FFFFFF',
    marginTop: 2,
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
  },
  welcomeCreditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
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
    gap: 4,
  },
  superScanText: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  superScanLimit: {
    fontSize: SIZES.text10,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    gap: 3,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
  },


  // === BANNIÈRES ===
  networkErrorBanner: {
    position: 'absolute',
    top: 185,
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

  // === CONTRÔLES FLOTTANTS ===
  controlsOverlay: {
    position: 'absolute',
    bottom: 40,
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

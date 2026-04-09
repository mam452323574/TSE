// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

// Mock expo-localization
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US', textDirection: 'ltr' }],
  locale: 'en-US',
}));

// Mock LanguageContext
const mockTranslations = {
  'scanner.camera_permission_msg': "Nous avons besoin d'accÃ©der Ã  votre camÃ©ra",
  'scanner.authorize_camera': 'Autoriser',
  'scanner.type_required_title': 'Type de scan requis',
  'scanner.type_required_msg': 'Veuillez sélectionner un type de scan.',
  'scanner.eligibility_error_title': 'Vérification du scan impossible',
  'scanner.eligibility_auth_msg': 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  'scanner.eligibility_unavailable_msg': 'La vérification de disponibilité du scan a échoué. Réessayez dans un instant.',
  'scan_types.health': 'Visage',
  'scan_types.body': 'Corps',
  'scan_types.nutrition': 'Nutrition',
  'scan_types.super': 'Super Scan',
  'scan_limit.limit_reached': 'Limite atteinte',
  'scan_limit.available': 'disponible',
  'scan_limit.loading': 'Chargement...',
  'scan_limit.unavailable': 'Indispo.',
  'scan_limit.auth_unready': 'Connexion...',
  'scan_limit.query_error': 'Erreur quota',
  'scan_limit.backend_unavailable': 'Service indispo.',
  'scan_limit.missing_payload': 'Données indispo.',
  'common.day': 'jour',
  'common.days': 'jours',
  'common.years_short': 'ans',
  'common.hour': 'heure',
  'common.hours': 'heures',
  'common.minute': 'minute',
  'common.minutes': 'minutes',
  'common.available': 'Disponible',
  'common.in': 'dans',
  'common.time.d': 'j',
  'common.time.h': 'h',
  'common.time.min': 'min',
  'common.time.s': 's',
  'scan_limits.msg_weekly_reached_with_time': 'Limite hebdomadaire atteinte. Prochain scan disponible dans {{time}}',
  'scan_limits.msg_monthly_reached_with_time': 'Limite mensuelle atteinte. Prochain scan disponible dans {{time}}',
  'scan_limits.msg_days_3_reached_with_time': 'Limite atteinte. Prochain scan disponible dans {{time}}',
  'scan_limits.msg_daily_reached_3_with_time': 'Limite quotidienne atteinte (3 scans). Prochain scan disponible dans {{time}}',
  'scan_limits.msg_daily_reached_1_with_time': 'Limite quotidienne atteinte (1 scan). Prochain scan disponible dans {{time}}',
  'scan_limits.msg_premium_only': 'RÃ©servÃ© aux membres Premium',
  'scan_limits.next_scan_available_title': 'Votre prochain scan est disponible dans {{time}}',
  'scan_limits.upgrade_unlimited_subtitle': 'Passez en Premium pour scanner sans limite',
  'common.account_free': 'Compte Gratuit',
  'common.account_premium': 'Compte Premium',
  'common.password': 'Mot de passe',
  'common.error': 'Erreur',
  'common.ok': 'OK',
  'common.cancel': 'Annuler',
  'common.back': 'Retour',
  'common.retry': 'Réessayer',
  'common.later': 'Plus tard',
  'common.next': 'Suivant',
  'common.error_config': 'Erreur de configuration',
  'share_story.title': 'Apercu',
  'share_story.share_action': 'Partager',
  'share_story.preview_caption': 'Apercu 9:16 pret a partager.',
  // Auth
  'auth.login_title': 'Health Scan',
  'auth.login_subtitle': 'Connectez-vous Ã  votre compte',
  'auth.login_btn': 'Se connecter',
  'auth.email_label': 'Email',
  'auth.email_placeholder': 'votre@email.com',
  'auth.password_placeholder': 'Entrez votre mot de passe',
  'auth.password_min_placeholder': 'Minimum 6 caracteres',
  'auth.password_confirm': 'Confirmer le mot de passe',
  'auth.password_confirm_placeholder': 'Retapez votre mot de passe',
  'auth.no_account': 'Pas encore de compte ?',
  'auth.signup_link': "S'inscrire",
  'auth.errors.fill_all': 'Veuillez remplir tous les champs',
  'auth.errors.invalid_credentials': 'Identifiants invalides',
  'auth.errors.general_error': 'Erreur gÃ©nÃ©rale',
  'auth.signup_title': 'Health Scan',
  'auth.signup_subtitle': 'Creez votre compte',
  'auth.signup_btn': 'Continuer',
  'auth.has_account': 'Deja un compte ?',
  'auth.login_link': 'Se connecter',
  'auth.signup_info': 'Un email de vÃ©rification vous sera envoyÃ©',
  'auth.verification_note': 'Un code de verification sera envoye a votre adresse email.',
  'auth.error_account_creation': 'Erreur lors de la creation du compte',
  'auth.error_ip_limit_reached': 'Limite atteinte pour ce rÃ©seau',
  'auth.error_username_taken': 'Ce nom d\'utilisateur est dÃ©jÃ  pris',
  'auth.error_session_invalid': 'Session invalide',
  'auth.error_auth_cancelled': 'Authentification annulÃ©e',
  'auth.error_disposable_email': 'Les emails jetables ne sont pas autorisÃ©s',
  'auth.error_email_verification_required': 'VÃ©rification de l\'email requise',
  'auth.error_verification_send': 'Erreur lors de l\'envoi du code',
  'auth.error_verification_code': 'Code de vÃ©rification invalide',
  'auth.or_divider': 'ou',
  // Email verification (used by tests)
  'email_verification.title': 'Verifiez votre email',
  'email_verification.subtitle': 'Un code a ete envoye',
  'email_verification.verify_btn': 'Verifier',
  'email_verification.resend_btn': 'Renvoyer le code',
  'email_verification.resend_cooldown': 'Renvoyer dans',
  'email_verification.cancel_btn': 'Annuler',
  // Email verification (used by component)
  'auth.verify_title': 'Verifiez votre email',
  'auth.verify_subtitle': 'Un code a ete envoye a votre adresse email',
  'auth.verify_btn': 'Verifier',
  'auth.verifying': 'Verification...',
  'auth.resend_code': 'Renvoyer le code',
  'auth.resend_in': 'Renvoyer dans {{seconds}}s',
  'auth.code_incomplete': 'Code incomplet',
  'auth.code_invalid': 'Code invalide',
  'auth.code_expired': 'Le code expire dans',
  'auth.remember_device': 'Se souvenir de cet appareil',
  'auth.verification_sent_title': 'Email verifie !',
  'auth.verification_sent_subtitle_signup': 'Redirection...',
  'auth.verification_sent_subtitle_login': 'Connexion...',
  'auth.error_login_generic': 'Erreur de connexion',
  // Premium
  'premium.title': 'Health Scan Premium',
  'premium.subtitle': 'DÃ©bloquez tout le potentiel de votre santÃ©',
  'premium.feature_title': 'FonctionnalitÃ© Premium',
  'premium.upgrade_btn': 'Passer Ã  Premium',
  'premium.hint': 'DÃ©bloquez cette fonctionnalitÃ© et bien plus encore',
  'premium.price': '9,99â‚¬/mois',
  'premium.period': '/mois',
  'premium.cancel_anytime': 'Annulable a tout moment',
  'premium.subscribe_btn': "S'abonner maintenant",
  'premium.benefits_title': 'Avantages Premium',
  'premium.back_btn': 'Retour',
  'premium.features_title': 'FonctionnalitÃ©s incluses',
  'premium.benefits.instant': 'AccÃ¨s instantanÃ©',
  'premium.benefits.tracking': 'Suivi avancÃ©',
  'premium.benefits.support': 'Support prioritaire',
  'premium.web_unavailable_title': 'Non disponible',
  'premium.web_disclaimer': 'Les achats ne sont disponibles que sur mobile',
  'premium.web_note': 'Disponible sur mobile uniquement',
  'premium.restore_btn': 'Restaurer les achats',
  'premium.restoring': 'Restauration...',
  'premium.restore_success_title': 'Restauration reussie',
  'premium.restore_success_msg': 'Vos achats ont ete restaures',
  'premium.restore_empty_title': 'Aucun achat',
  'premium.restore_empty': 'Aucun achat premium trouve',
  'super_scan_features.premium_badge': 'Premium',
  'super_scan_features.connection_reconnecting': 'Reconnexion en cours...',
  'super_scan_features.connection_unstable': 'Connexion instable. Appuyez pour réessayer.',
  'premium.restore_error_default': 'Erreur lors de la restauration',
  'premium.restore_error_generic': 'Erreur lors de la restauration',
  'premium.validation_title': 'Validation',
  'premium.processing': 'Traitement en cours...',
  'premium.purchase_success_title': 'Felicitations !',
  'premium.purchase_success_msg': 'Vous etes maintenant Premium',
  'premium.purchase_error_default': 'Erreur lors de l\'achat',
  'premium.purchase_error_generic': 'Erreur lors de l\'achat',
  'premium.already_premium_title': 'Vous etes Premium',
  'premium.already_premium_desc': 'Vous avez deja acces a toutes les fonctionnalites',
  // Avatar
  'components.avatar.hint': 'Appuyez pour modifier',
  'components.avatar.error_title': 'Erreur',
  'components.avatar.error_size': 'Image trop volumineuse (max 5MB)',
  'components.avatar.error_download': 'Erreur lors du telechargement',
  'components.avatar.error_picker_launch': 'Impossible d\'ouvrir le selecteur de photo pour le moment.',
  'components.avatar.error_camera_unavailable': 'La camera n\'est pas disponible sur cet appareil.',
  'components.avatar.perm_title': 'Permissions requises',
  'components.avatar.perm_gallery': 'Acces a la galerie requis',
  'components.avatar.perm_camera': 'Acces a la camera requis',
  'components.avatar.options_title': 'Photo de profil',
  'components.avatar.options_msg': 'Choisissez une source',
  'components.avatar.take_photo': 'Prendre une photo',
  'components.avatar.choose_gallery': 'Choisir de la galerie',
  'components.avatar.open_settings': 'Ouvrir les parametres',
  // FeatureGate
  'components.feature_gate.title': 'FonctionnalitÃ© Premium',
  'components.feature_gate.upgrade_btn': 'Passer Ã  Premium',
  'components.feature_gate.hint': 'DÃ©bloquez cette fonctionnalitÃ© et bien plus encore',
  // FeatureComparisonList
  'components.feature_list.free': 'Gratuit',
  'components.feature_list.premium': 'Premium',
  // FeatureComparisonTable
  'components.table.header_feature': 'FonctionnalitÃ©',
  'components.table.header_free': 'Gratuit',
  'components.table.header_premium': 'Premium',
  // Onboarding / UsernameSetup
  'onboarding.welcome_title': 'Bienvenue !',
  'onboarding.setup_profile': 'Configurez votre profil',
  'onboarding.choose_style': 'Choisissez votre style',
  'onboarding.avatar_title': 'Ajoutez une photo de profil',
  'onboarding.avatar_subtitle': "C'est optionnel pour l'instant.",
  'onboarding.avatar_change_title': 'Photo de profil',
  'onboarding.avatar_change_subtitle': 'Gardez-la ou changez-la plus tard.',
  'onboarding.avatar_skip': 'Passer pour le moment',
  'onboarding.username_label': 'Nom d\'utilisateur',
  'onboarding.username_placeholder': 'pseudo123',
  'onboarding.next_btn': 'Suivant',
  'onboarding.start_btn': 'Commencer l\'aventure',
  'onboarding.enter_app': 'Ouvrir l\'app',
  'onboarding.slide_1_title': 'La balance ment. Le miroir improvise.',
  'onboarding.slide_1_subtitle': 'Sans scan, vous lisez une impression. Pas un signal.',
  'onboarding.slide_2_title': 'Le scan lit. La donnÃ©e tranche.',
  'onboarding.slide_2_subtitle': 'Visage, corps, nutrition. Une lecture nette. Sans approximation.',
  'onboarding.slide_3_title': 'Suivez la trajectoire. Pas l\'humeur.',
  'onboarding.slide_3_subtitle': 'Mesurez ce qui bouge. Ne roulez plus a l\'aveugle.',
  'onboarding.error_session': 'Session invalide',
  'onboarding.error_email': 'Email non verifie',
  'onboarding.error_username_empty': 'Nom d\'utilisateur requis',
  'onboarding.error_username_taken': 'Ce nom est deja pris',
  'onboarding.username_status.checking': 'Verification...',
  'onboarding.username_status.available': 'Disponible',
  'onboarding.username_status.taken': 'Deja pris',
  'onboarding.username_status.invalid': 'Format invalide',
  'onboarding.theme.dark': 'Sombre',
  'onboarding.theme.dark_desc': 'Mode sombre pour un confort visuel',
  'onboarding.theme.light': 'Clair',
  'onboarding.theme.light_desc': 'Mode clair classique',
  'social.composer.identity_meta': 'Publication avec votre profil public',
  'social.composer.draft_loading': 'Chargement du brouillon...',
  'social.composer.draft_missing': 'Brouillon introuvable',
  // Recipes
  'recipes.title': 'Nos Recettes',
  'recipes.no_results': 'Aucune recette trouvÃ©e',
  'recipes.search_placeholder': 'Rechercher une recette...',
  'recipes.prep_time': 'min',
  'recipes.difficulty.easy': 'Facile',
  'recipes.difficulty.medium': 'Moyen',
  'recipes.difficulty.hard': 'Difficile',
  // Exercises
  'exercises.title': 'Nos Exercices',
  'exercises.no_results': 'Aucun exercice trouvÃ©',
  'exercises.search_placeholder': 'Rechercher un exercice...',
  'exercises.duration': 'min',
  'exercises.difficulty.easy': 'Facile',
  'exercises.difficulty.medium': 'Moyen',
  'exercises.difficulty.hard': 'Difficile',
  // ScanPreview
  'scan_preview.type_label': 'Type de scan',
  'scan_preview.confirm_button': 'Confirmer',
  'scan_preview.confirm_loading': 'Analyse en cours...',
  'scan_preview.error_title_analysis': 'Erreur d\'analyse',
  'scan_preview.error_title_type': 'Type incompatible',
  'scan_preview.error_title_session': 'Session expirée',
  'scan_preview.error_title_network': 'Erreur réseau',
  'scan_preview.error_title_timeout': 'Analyse trop longue',
  'scan_preview.error_title_upload': 'Envoi impossible',
  'scan_preview.error_title_provider': 'Service d\'analyse indisponible',
  'scan_preview.error_title_server': 'Erreur serveur',
  'scan_preview.error_msg_default': 'Oups, l\'image n\'a pas pu être analysée.',
  'scan_preview.error_msg_type': 'Le type d\'analyse retourné ne correspond pas au scan demandé.',
  'scan_preview.error_msg_network': 'Impossible de contacter le serveur d\'analyse.',
  'scan_preview.error_msg_session': 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  'scan_preview.error_msg_timeout': 'L\'analyse prend trop de temps. Réessayez dans un instant.',
  'scan_preview.error_msg_upload': 'L\'image du scan n\'a pas pu être envoyée ou retrouvée côté stockage.',
  'scan_preview.error_msg_provider': 'Le fournisseur d\'analyse est indisponible ou mal configuré pour ce scan.',
  'scan_preview.error_msg_server': 'Le traitement du scan a échoué côté serveur. Réessayez dans un instant.',
  'scan_preview.error_validation': 'Paramètres invalides.',
  // Settings
  'settings.select_language_title': 'Choisir la langue',
};


jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key, params) => {
      let value = mockTranslations[key];
      if (value === undefined) {
        // Support defaultValue for dynamic keys (e.g. premium_features.categories.X)
        if (params && params.defaultValue !== undefined) {
          return params.defaultValue;
        }
        return key;
      }
      if (params) {
        Object.keys(params).forEach(k => {
          if (k !== 'defaultValue') {
            value = value.replace(`{{${k}}}`, params[k]);
          }
        });
      }
      return value;
    },
    language: 'fr',
    locale: 'fr',
    changeLanguage: jest.fn(),
  }),
  LanguageProvider: ({ children }) => children,
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
}));

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() => Promise.resolve({ uri: 'manipulated-image-uri', width: 100, height: 100, base64: 'test-base-64' })),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

jest.mock('expo-image-picker', () => ({
  getCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', granted: true, canAskAgain: true })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', granted: true, canAskAgain: true })
  ),
  getMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      accessPrivileges: 'all',
    })
  ),
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      accessPrivileges: 'all',
    })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({ canceled: true, assets: [] })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ canceled: true, assets: [] })
  ),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `exp://${path}`),
  openURL: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'test-push-token' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  AndroidImportance: {
    MAX: 5,
  },
  setNotificationChannelAsync: jest.fn(),
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
    DAILY: 'daily',
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => { };
  return Reanimated;
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  performAndroidHapticsAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
    Soft: 'soft',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  AndroidHaptics: {
    Confirm: 'confirm',
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-image', () => {
  const { Image } = require('react-native');

  return {
    Image,
  };
});

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true]),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  EncodingType: {
    Base64: 'base64',
  },
  downloadAsync: jest.fn(() =>
    Promise.resolve({ uri: 'file:///cache/social-post-test.jpg' })
  ),
  getInfoAsync: jest.fn(() =>
    Promise.resolve({ exists: true, size: 1024 })
  ),
  readAsStringAsync: jest.fn(() =>
    Promise.resolve('dGVzdA==')
  ),
}));

jest.mock('@aptabase/react-native', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    trackEvent: jest.fn(),
    dispose: jest.fn(),
  },
  init: jest.fn(),
  trackEvent: jest.fn(),
  dispose: jest.fn(),
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(() => Promise.resolve('file:///tmp/share-story.png')),
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const mockComponent = (name) => {
    return ({ children, ...props }) =>
      React.createElement(name, props, children);
  };

  return {
    __esModule: true,
    default: mockComponent('Svg'),
    Svg: mockComponent('Svg'),
    Circle: mockComponent('Circle'),
    G: mockComponent('G'),
    Path: mockComponent('Path'),
    Text: mockComponent('SvgText'),
  };
});

jest.mock('expo-navigation-bar', () => ({
  setBackgroundColorAsync: jest.fn(() => Promise.resolve()),
  setBorderColorAsync: jest.fn(() => Promise.resolve()),
  setButtonStyleAsync: jest.fn(() => Promise.resolve()),
  setStyle: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#F2F2F7',
      cardBackground: '#FFFFFF',
      primaryText: '#1D1D1F',
      secondaryText: '#FFFFFF',
      accentGreen: '#34C759',
      accent: '#007AFF',
      lightGray: '#E5E5EA',
      gray: '#8E8E93',
      grayLight: '#F8F8FA',
      grayMedium: '#C7C7CC',
      darkGray: '#424242',
      primary: '#007AFF',
      primaryLight: '#E3F2FF',
      primaryDark: '#0056B3',
      secondary: '#5856D6',
      white: '#FFFFFF',
      error: '#FF3B30',
      success: '#34C759',
      successLight: '#E8F9ED',
      warning: '#FF9500',
      gold: '#FFD700',
      goldLight: '#FFF8E1',
    },
    isDark: false,
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
  }),
}));

const mockUser = { id: 'test-user', email: 'test@example.com' };
const mockSession = { access_token: 'test-token' };
const mockUseAuth = jest.fn(() => ({
  user: mockUser,
  session: mockSession,
  userProfile: {
    id: 'test-user',
    account_tier: 'free',
    avatar_url: null,
    has_seen_tutorial: false,
  },
  isLoading: false,
  loading: false,
  signOut: jest.fn(),
  refreshUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  updateAvatarUrl: jest.fn(),
  markTutorialSeen: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  modelName: 'Test Device',
  osVersion: '14.0',
  brand: 'Test Brand',
  manufacturer: 'Test Manufacturer',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
  AuthProvider: ({ children }) => children,
}));

// Mock Supabase
jest.mock('@/services/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
        order: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
          limit: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
      order: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
        limit: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } }, error: null }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' }, session: { access_token: 'test-token' } }, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' }, session: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      verifyOtp: jest.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } }, error: null }),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.jpg' } }),
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://test.com/signed-image.jpg' }, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  },
}));

// Mock lucide-react-native - return simple string components
jest.mock('lucide-react-native', () => {
  return new Proxy({}, {
    get: function (target, prop) {
      if (prop === '__esModule') return true;
      // Return a simple mock component (string) for React
      return prop;
    }
  });
});

// Mock LanguageSelector component directly to avoid lucide rendering issues
jest.mock('@/components/LanguageSelector', () => ({
  LanguageSelector: () => 'LanguageSelector',
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

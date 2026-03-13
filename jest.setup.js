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
  'scanner.camera_permission_msg': "Nous avons besoin d'accéder à votre caméra",
  'scanner.authorize_camera': 'Autoriser',
  'scan_types.health': 'Visage',
  'scan_types.body': 'Corps',
  'scan_types.nutrition': 'Nutrition',
  'scan_types.super': 'Super Scan',
  'scan_limit.limit_reached': 'Limite atteinte',
  'scan_limit.available': 'disponible',
  'common.available': 'Disponible',
  'common.in': 'dans',
  'common.time.d': 'j',
  'common.time.h': 'h',
  'common.time.min': 'min',
  'common.time.s': 's',
  'common.account_free': 'Compte Gratuit',
  'common.account_premium': 'Compte Premium',
  'common.password': 'Mot de passe',
  'common.error': 'Erreur',
  'common.ok': 'OK',
  'common.cancel': 'Annuler',
  'common.back': 'Retour',
  'common.later': 'Plus tard',
  'common.error_config': 'Erreur de configuration',
  // Auth
  'auth.login_title': 'Health Scan',
  'auth.login_subtitle': 'Connectez-vous à votre compte',
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
  'auth.errors.general_error': 'Erreur générale',
  'auth.signup_title': 'Health Scan',
  'auth.signup_subtitle': 'Creez votre compte',
  'auth.signup_btn': 'Continuer',
  'auth.has_account': 'Deja un compte ?',
  'auth.login_link': 'Se connecter',
  'auth.signup_info': 'Un email de vérification vous sera envoyé',
  'auth.verification_note': 'Un code de verification sera envoye a votre adresse email.',
  'auth.error_account_creation': 'Erreur lors de la creation du compte',
  'auth.error_ip_limit_reached': 'Limite atteinte pour ce réseau',
  'auth.error_username_taken': 'Ce nom d\'utilisateur est déjà pris',
  'auth.error_session_invalid': 'Session invalide',
  'auth.error_auth_cancelled': 'Authentification annulée',
  'auth.error_disposable_email': 'Les emails jetables ne sont pas autorisés',
  'auth.error_email_verification_required': 'Vérification de l\'email requise',
  'auth.error_verification_send': 'Erreur lors de l\'envoi du code',
  'auth.error_verification_code': 'Code de vérification invalide',
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
  'premium.subtitle': 'Débloquez tout le potentiel de votre santé',
  'premium.feature_title': 'Fonctionnalité Premium',
  'premium.upgrade_btn': 'Passer à Premium',
  'premium.hint': 'Débloquez cette fonctionnalité et bien plus encore',
  'premium.price': '9,99€/mois',
  'premium.period': '/mois',
  'premium.cancel_anytime': 'Annulable a tout moment',
  'premium.subscribe_btn': "S'abonner maintenant",
  'premium.benefits_title': 'Avantages Premium',
  'premium.back_btn': 'Retour',
  'premium.features_title': 'Fonctionnalités incluses',
  'premium.benefits.instant': 'Accès instantané',
  'premium.benefits.tracking': 'Suivi avancé',
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
  'components.avatar.perm_title': 'Permissions requises',
  'components.avatar.perm_gallery': 'Acces a la galerie requis',
  'components.avatar.perm_camera': 'Acces a la camera requis',
  'components.avatar.options_title': 'Photo de profil',
  'components.avatar.options_msg': 'Choisissez une source',
  'components.avatar.take_photo': 'Prendre une photo',
  'components.avatar.choose_gallery': 'Choisir de la galerie',
  // FeatureGate
  'components.feature_gate.title': 'Fonctionnalité Premium',
  'components.feature_gate.upgrade_btn': 'Passer à Premium',
  'components.feature_gate.hint': 'Débloquez cette fonctionnalité et bien plus encore',
  // FeatureComparisonList
  'components.feature_list.free': 'Gratuit',
  'components.feature_list.premium': 'Premium',
  // FeatureComparisonTable
  'components.table.header_feature': 'Fonctionnalité',
  'components.table.header_free': 'Gratuit',
  'components.table.header_premium': 'Premium',
  // Onboarding / UsernameSetup
  'onboarding.welcome_title': 'Bienvenue !',
  'onboarding.setup_profile': 'Configurez votre profil',
  'onboarding.choose_style': 'Choisissez votre style',
  'onboarding.username_label': 'Nom d\'utilisateur',
  'onboarding.username_placeholder': 'pseudo123',
  'onboarding.next_btn': 'Suivant',
  'onboarding.start_btn': 'Commencer l\'aventure',
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
  // Recipes
  'recipes.title': 'Nos Recettes',
  'recipes.no_results': 'Aucune recette trouvée',
  'recipes.search_placeholder': 'Rechercher une recette...',
  'recipes.prep_time': 'min',
  'recipes.difficulty.easy': 'Facile',
  'recipes.difficulty.medium': 'Moyen',
  'recipes.difficulty.hard': 'Difficile',
  // Exercises
  'exercises.title': 'Nos Exercices',
  'exercises.no_results': 'Aucun exercice trouvé',
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
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
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
  isLoading: false,
  loading: false,
  signOut: jest.fn(),
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
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
      upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
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

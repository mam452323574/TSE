export const LIGHT_COLORS = {
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
};

export const DARK_COLORS = {
  background: '#000000',
  cardBackground: '#1C1C1E',
  primaryText: '#FFFFFF',
  secondaryText: '#8E8E93',
  accentGreen: '#30D158',
  accent: '#0A84FF',
  lightGray: '#2C2C2E',
  gray: '#8E8E93',
  grayLight: '#1C1C1E', // Often used for inputs or secondary cards
  grayMedium: '#48484A',
  darkGray: '#D1D1D6', // Using lighter gray for "darkGray" in dark mode for visibility
  primary: '#0A84FF',
  primaryLight: '#002B5C', // Darker shade of primary
  primaryDark: '#0040DD',
  secondary: '#5E5CE6',
  white: '#FFFFFF', // Keep white as white for specific usages
  error: '#FF453A',
  success: '#30D158',
  successLight: '#053312', // Dark green background
  warning: '#FF9F0A',
  gold: '#FFD60A',
  goldLight: '#4D3F00', // Dark gold background
};

export type ThemeType = 'light' | 'dark';

export const COLORS = LIGHT_COLORS; // Backward compatibility for now, will be removed/unused in refactored files


export const FONTS = {
  regular: 'System',
  semiBold: 'System',
  bold: 'System',
};

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

export const SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  text10: 10,
  text12: 12,
  text14: 14,
  text16: 16,
  text18: 18,
  text20: 20,
  scoreNumber: 48,
  scoreSub: 14,
};

export const SPACING = {
  page: 16,
  block: 24,
  card: 12,
  benefit: 8,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  card: 12,
  button: 8,
  tag: 8,
  full: 9999,
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
};

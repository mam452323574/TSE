import { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ScanType } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

interface CameraGuideProps {
  scanType: ScanType | null;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const CORNER_SIZE = 30;
const CORNER_THICKNESS = 4;

export function CameraGuide({ scanType }: CameraGuideProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!scanType) return null;

  let width: number;
  let height: number;

  switch (scanType) {
    case 'nutrition':
      width = SCREEN_WIDTH * 0.7;
      height = width;
      break;
    case 'body':
      width = SCREEN_WIDTH * 0.7; // Aussi large que nutrition
      height = SCREEN_HEIGHT * 0.45; // Plus haut que nutrition mais sans toucher les boutons
      break;
    case 'health':
    case 'super':
      width = SCREEN_WIDTH * 0.5;
      height = SCREEN_HEIGHT * 0.35;
      break;
    default:
      return null;
  }

  const isSuper = scanType === 'super';

  return (
    <View style={styles.centeringContainer}>
      <View style={[styles.guideFrame, { width, height }]}>
        <View style={[styles.cornerTopLeft, styles.corner, isSuper && styles.superCornerTopLeft]} />
        <View style={[styles.cornerTopRight, styles.corner, isSuper && styles.superCornerTopRight]} />
        <View style={[styles.cornerBottomLeft, styles.corner, isSuper && styles.superCornerBottomLeft]} />
        <View style={[styles.cornerBottomRight, styles.corner, isSuper && styles.superCornerBottomRight]} />
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  centeringContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  guideFrame: {
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.secondaryText,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.secondaryText,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.secondaryText,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.secondaryText,
  },
  // Super Scan Styles
  superCornerTopLeft: {
    borderColor: '#FFD700',
    borderTopWidth: CORNER_THICKNESS + 2,
    borderLeftWidth: CORNER_THICKNESS + 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  superCornerTopRight: {
    borderColor: '#FFD700',
    borderTopWidth: CORNER_THICKNESS + 2,
    borderRightWidth: CORNER_THICKNESS + 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  superCornerBottomLeft: {
    borderColor: '#FFD700',
    borderBottomWidth: CORNER_THICKNESS + 2,
    borderLeftWidth: CORNER_THICKNESS + 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  superCornerBottomRight: {
    borderColor: '#FFD700',
    borderBottomWidth: CORNER_THICKNESS + 2,
    borderRightWidth: CORNER_THICKNESS + 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
});

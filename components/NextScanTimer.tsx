import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SIZES, SPACING, FONT_WEIGHTS } from '@/constants/theme';

interface NextScanTimerProps {
  nextAvailableDate: number;
  scanLabel?: string;
  onTimerComplete?: () => void;
  textColor?: string;
  iconColor?: string;
}

export function NextScanTimer({ nextAvailableDate, scanLabel, onTimerComplete, textColor, iconColor }: NextScanTimerProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const onTimerCompleteRef = useRef(onTimerComplete);

  useEffect(() => {
    onTimerCompleteRef.current = onTimerComplete;
  }, [onTimerComplete]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const updateTimer = () => {
      const now = Date.now();
      const diff = nextAvailableDate - now;

      if (diff <= 0) {
        setTimeRemaining('');
        setIsAvailable((prev) => {
          if (!prev) {
            onTimerCompleteRef.current?.();
          }
          return true;
        });
        if (intervalId) clearInterval(intervalId);
        return;
      }

      setIsAvailable(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Format plus naturel et compact
      if (days > 0) {
        setTimeRemaining(`${days}${t('common.time.d')} ${hours}${t('common.time.h')}`);
      } else if (hours > 0) {
        const paddedMin = minutes.toString().padStart(2, '0');
        setTimeRemaining(`${hours}${t('common.time.h')}${paddedMin}`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes} ${t('common.time.min')}`);
      } else {
        setTimeRemaining(`${seconds}${t('common.time.s')}`);
      }
    };

    updateTimer();
    const diff = nextAvailableDate - Date.now();
    const intervalMs = diff <= 120000 ? 1000 : 60000;
    intervalId = setInterval(updateTimer, intervalMs);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [nextAvailableDate, t]);

  if (isAvailable) {
    return (
      <View style={styles.container}>
        <Clock color={colors.success} size={12} strokeWidth={2.5} />
        <Text style={[styles.text, styles.availableText]}>
          {t('common.available')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Clock color={iconColor || "rgba(255, 255, 255, 0.6)"} size={12} strokeWidth={2.5} />
      <Text style={[styles.text, textColor ? { color: textColor } : undefined]}>
        {scanLabel ? `${scanLabel} ` : ''}{t('common.in')} {timeRemaining}
      </Text>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    gap: 4,
    marginTop: SPACING.xs,
  },
  text: {
    fontSize: SIZES.text10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: FONT_WEIGHTS.medium,
    fontStyle: 'italic',
  },
  availableText: {
    color: colors.success,
    fontStyle: 'normal',
  },
});

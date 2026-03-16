import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Identifiants pour gerer les notifications planifiees
const NOTIFICATION_IDS = {
  DAILY_REMINDER: 'daily-reminder',
  SUPER_SCAN_RESET: 'super-scan-reset',
  MOTIVATION: 'motivation',
  SCAN_READY: 'scan-ready-', // Sera suffixé par le type de scan
};

export function useNotifications() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!user) return;

    isMountedRef.current = true;

    registerForPushNotificationsAsync().then(async (token) => {
      if (!isMountedRef.current) return;
      if (token) {
        setExpoPushToken(token);
        await savePushTokenToDatabase(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      if (isMountedRef.current) {
        setNotification(notification);
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      handleNotificationResponse(data);
    });

    return () => {
      isMountedRef.current = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  const savePushTokenToDatabase = async (token: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_profiles')
      .update({ push_token: token })
      .eq('id', user.id);

    if (error) {
      console.error('Error saving push token:', error);
    }
  };

  const handleNotificationResponse = (_data: any) => {
  };

  const scheduleLocalNotification = async (title: string, body: string, data?: any) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
    });
  };

  // Rappel quotidien (tous les jours a 10h)
  const scheduleDailyReminder = useCallback(async () => {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.DAILY_REMINDER);

      const index = Math.floor(Math.random() * 6) + 1;
      const title = t(`notifications.daily_reminders.${index}.title`);
      const body = t(`notifications.daily_reminders.${index}.body`);

      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_IDS.DAILY_REMINDER,
        content: {
          title,
          body,
          data: { type: 'daily_reminder' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 10,
          minute: 0,
        },
      });
      console.log('[Notifications] Rappel quotidien planifie pour 10h');
    } catch (error) {
      console.error('[Notifications] Erreur planification rappel quotidien:', error);
    }
  }, [t]);

  // Reset Super Scan (planifie pour le lendemain a 8h)
  const scheduleSuperScanReset = useCallback(async () => {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.SUPER_SCAN_RESET);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);

      const index = Math.floor(Math.random() * 3) + 1;
      const title = t(`notifications.super_scan_ready.${index}.title`);
      const body = t(`notifications.super_scan_ready.${index}.body`);

      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_IDS.SUPER_SCAN_RESET,
        content: {
          title,
          body,
          data: { type: 'super_scan_reset' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: tomorrow,
        },
      });
      console.log('[Notifications] Reset Super Scan planifie pour demain 8h');
    } catch (error) {
      console.error('[Notifications] Erreur planification Super Scan reset:', error);
    }
  }, [t]);

  // Alerte Scan prêt (planifié à une date précise)
  const scheduleScanReadyNotification = useCallback(async (scanType: import('@/types').ScanType, nextDateMs: number) => {
    if (Platform.OS === 'web') return;

    const notificationId = `${NOTIFICATION_IDS.SCAN_READY}${scanType}`;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);

      const futureDate = new Date(nextDateMs);
      if (futureDate.getTime() <= Date.now()) return;

      const title = t(`notifications.scan_${scanType}_title`);
      const body = t(`notifications.scan_${scanType}_body`);

      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title,
          body,
          data: { type: 'scan_ready', scanType },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: futureDate,
        },
      });
      console.log(`[Notifications] Scan Ready planifié pour ${scanType} à ${futureDate.toLocaleString()}`);
    } catch (error) {
      console.error(`[Notifications] Erreur planification Scan Ready (${scanType}):`, error);
    }
  }, [t]);

  // Notification de motivation (planifiee dans 2-5 jours)
  const scheduleMotivationalNotification = useCallback(async () => {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.MOTIVATION);

      const daysLater = 2 + Math.floor(Math.random() * 4); // 2 a 5 jours
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysLater);
      futureDate.setHours(14, 0, 0, 0); // 14h

      const index = Math.floor(Math.random() * 6) + 1;
      const title = t(`notifications.motivational.${index}.title`);
      const body = t(`notifications.motivational.${index}.body`);

      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_IDS.MOTIVATION,
        content: {
          title,
          body,
          data: { type: 'motivation' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: futureDate,
        },
      });
      console.log(`[Notifications] Motivation planifiee dans ${daysLater} jours a 14h`);
    } catch (error) {
      console.error('[Notifications] Erreur planification motivation:', error);
    }
  }, [t]);

  // Annuler toutes les notifications planifiees
  const cancelAllScheduledNotifications = useCallback(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[Notifications] Toutes les notifications planifiees annulees');
    } catch (error) {
      console.error('[Notifications] Erreur annulation notifications:', error);
    }
  }, []);

  return {
    expoPushToken,
    notification,
    scheduleLocalNotification,
    scheduleDailyReminder,
    scheduleSuperScanReset,
    scheduleMotivationalNotification,
    scheduleScanReadyNotification,
    cancelAllScheduledNotifications,
  };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'web') {
    return null;
  }

  // Désactiver pour Expo Go (évite les warnings inutiles)
  if (Constants.appOwnership === 'expo') {
    console.log('[useNotifications] Expo Go détecté : Notifications push désactivées via EAS.');
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    try {
      // Récupérer le projectId depuis la configuration EAS
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId || projectId === 'YOUR_EAS_PROJECT_ID') {
        console.warn('[useNotifications] projectId EAS non configuré. Exécutez "npx eas-cli project:init" ou configurez-le manuellement dans app.json');
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (error) {
      console.warn('[useNotifications] Échec de récupération du push token:', error);
      return null;
    }
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E3A2B',
    });
  }

  return token;
}

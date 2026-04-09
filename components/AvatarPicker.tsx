import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import { Camera } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { buildCanonicalAvatarPath, clearAvatarUrlCache } from '@/services/avatar';

interface AvatarPickerProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onAvatarSelected: (avatarReference: string) => void;
  size?: number;
}

const PICKER_LAUNCH_DELAY_MS = 60;
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

function hasMediaLibraryAccess(permission: ImagePicker.MediaLibraryPermissionResponse) {
  return permission.granted || permission.accessPrivileges === 'limited';
}

export function AvatarPicker({ userId, currentAvatarUrl, onAvatarSelected, size = 120 }: AvatarPickerProps) {
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { showAlert, alertElement } = useCustomAlert();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const openDeviceSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening device settings:', error);
    }
  };

  const showPermissionAlert = (
    message: string,
    canAskAgain: boolean | undefined,
  ) => {
    const shouldShowSettings = Platform.OS !== 'web' && canAskAgain === false;

    showAlert(
      t('components.avatar.perm_title'),
      message,
      shouldShowSettings
        ? [
            {
              text: t('components.avatar.open_settings'),
              onPress: () => {
                void openDeviceSettings();
              },
            },
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
          ]
        : [{ text: t('common.ok') }],
    );
  };

  const showPickerError = (error: unknown, isCamera: boolean) => {
    console.error(
      isCamera
        ? 'Error launching avatar camera picker:'
        : 'Error launching avatar gallery picker:',
      error,
    );

    const message =
      error instanceof Error &&
      isCamera &&
      /(camera|simulator|available|device)/i.test(error.message)
        ? t('components.avatar.error_camera_unavailable')
        : t('components.avatar.error_picker_launch');

    showAlert(t('components.avatar.error_title'), message, [
      { text: t('common.ok') },
    ]);
  };

  const runPickerAction = (action: () => Promise<void>) => {
    if (Platform.OS === 'web') {
      void action();
      return;
    }

    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        void action();
      }, PICKER_LAUNCH_DELAY_MS);
    });
  };

  const ensureMediaLibraryPermission = async () => {
    if (Platform.OS === 'web') {
      return { granted: true, canAskAgain: true };
    }

    const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (hasMediaLibraryAccess(currentPermission)) {
      return {
        granted: true,
        canAskAgain: currentPermission.canAskAgain,
      };
    }

    const requestedPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return {
      granted: hasMediaLibraryAccess(requestedPermission),
      canAskAgain: requestedPermission.canAskAgain,
    };
  };

  const ensureCameraPermission = async () => {
    if (Platform.OS === 'web') {
      return { granted: true, canAskAgain: true };
    }

    const currentPermission = await ImagePicker.getCameraPermissionsAsync();
    if (currentPermission.granted) {
      return {
        granted: true,
        canAskAgain: currentPermission.canAskAgain,
      };
    }

    const requestedPermission = await ImagePicker.requestCameraPermissionsAsync();
    return {
      granted: requestedPermission.granted,
      canAskAgain: requestedPermission.canAskAgain,
    };
  };

  const prepareAvatar = async (uri: string) => {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 512, height: 512 } }],
      {
        compress: 0.82,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    if (Platform.OS === 'web') {
      const response = await fetch(manipulatedImage.uri);
      const blob = await response.blob();

      if (blob.size > MAX_AVATAR_SIZE_BYTES) {
        throw new Error(t('components.avatar.error_size'));
      }

      return {
        uri: manipulatedImage.uri,
        arrayBuffer: await blob.arrayBuffer(),
      };
    }

    const fileInfo = await FileSystem.getInfoAsync(manipulatedImage.uri);

    if (!fileInfo.exists) {
      throw new Error(t('components.avatar.error_download'));
    }

    if (
      typeof fileInfo.size === 'number' &&
      fileInfo.size > MAX_AVATAR_SIZE_BYTES
    ) {
      throw new Error(t('components.avatar.error_size'));
    }

    const base64Payload = await FileSystem.readAsStringAsync(
      manipulatedImage.uri,
      {
        encoding: FileSystem.EncodingType.Base64,
      },
    );

    if (!base64Payload) {
      throw new Error(t('components.avatar.error_download'));
    }

    return {
      uri: manipulatedImage.uri,
      arrayBuffer: decodeBase64(base64Payload),
    };
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);

      const preparedAvatar = await prepareAvatar(uri);
      const filePath = buildCanonicalAvatarPath(userId, 'jpg');

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, preparedAvatar.arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      clearAvatarUrlCache(filePath);
      setLocalUri(preparedAvatar.uri);
      onAvatarSelected(filePath);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showAlert(t('components.avatar.error_title'), error instanceof Error ? error.message : t('components.avatar.error_download'));
    } finally {
      setUploading(false);
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const permission = await ensureMediaLibraryPermission();
      if (!permission.granted) {
        showPermissionAlert(
          t('components.avatar.perm_gallery'),
          permission.canAskAgain,
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      const selectedAsset = result.canceled ? null : result.assets?.[0];
      if (selectedAsset?.uri) {
        await uploadAvatar(selectedAsset.uri);
      }
    } catch (error) {
      showPickerError(error, false);
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ensureCameraPermission();
      if (!permission.granted) {
        showPermissionAlert(
          t('components.avatar.perm_camera'),
          permission.canAskAgain,
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      const capturedAsset = result.canceled ? null : result.assets?.[0];
      if (capturedAsset?.uri) {
        await uploadAvatar(capturedAsset.uri);
      }
    } catch (error) {
      showPickerError(error, true);
    }
  };

  const showOptions = () => {
    showAlert(
      t('components.avatar.options_title'),
      t('components.avatar.options_msg'),
      [
        {
          text: t('components.avatar.take_photo'),
          onPress: () => runPickerAction(takePhoto),
        },
        {
          text: t('components.avatar.choose_gallery'),
          onPress: () => runPickerAction(pickImageFromLibrary),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {alertElement}
      <TouchableOpacity
        style={[styles.avatarContainer, { width: size, height: size }]}
        onPress={showOptions}
        disabled={uploading}
        testID="avatar-picker-trigger"
      >
        <ProfileAvatar
          avatarUrl={localUri || currentAvatarUrl}
          username={t('common.unknown_user')}
          size={size}
          style={styles.avatar}
          testID="avatar-picker-image"
        />
        {uploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.white} />
          </View>
        )}
        {!uploading && (
          <View style={styles.editBadge}>
            <Camera color={colors.white} size={16} />
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.hint}>{t('components.avatar.hint')}</Text>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    borderRadius: 1000,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.primary,
    position: 'relative',
  },
  avatar: {
    borderRadius: 1000,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.cardBackground,
  },
  hint: {
    marginTop: SPACING.sm,
    fontSize: SIZES.sm,
    color: colors.gray,
  },
});

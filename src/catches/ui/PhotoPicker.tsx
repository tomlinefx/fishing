// 写真の添付（WF-1 手順2）: カメラ／ライブラリ、許可の要求は操作の直前（BR5.2）、拒否時は案内と設定導線（BR5.1）。
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { messages } from '../messages';
import { FieldError } from './FieldError';
import { colors, MIN_TAP_SIZE, spacing } from './theme';

type Props = {
  readonly photoUri: string | null;
  readonly onPhotoSelected: (uri: string) => void;
  readonly disabled?: boolean;
  /** CatchLog の検証文言（BR1.1） */
  readonly error?: string;
};

type Source = 'camera' | 'library';

type PickerState =
  | { readonly status: 'idle' }
  | { readonly status: 'busy' }
  | { readonly status: 'denied' }
  | { readonly status: 'failed' };

async function requestPermission(source: Source): Promise<boolean> {
  const response =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  return response.granted;
}

async function launchPicker(source: Source): Promise<ImagePicker.ImagePickerResult> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  return source === 'camera'
    ? ImagePicker.launchCameraAsync(options)
    : ImagePicker.launchImageLibraryAsync(options);
}

export function PhotoPicker({ photoUri, onPhotoSelected, disabled = false, error }: Props) {
  const [state, setState] = useState<PickerState>({ status: 'idle' });
  const isBusy = state.status === 'busy';

  async function pick(source: Source) {
    if (disabled || isBusy) {
      return;
    }
    setState({ status: 'busy' });
    try {
      const granted = await requestPermission(source);
      if (!granted) {
        setState({ status: 'denied' });
        return;
      }
      const result = await launchPicker(source);
      const asset = result.canceled ? undefined : result.assets[0];
      if (asset !== undefined) {
        onPhotoSelected(asset.uri);
      }
      setState({ status: 'idle' });
    } catch (cause) {
      console.error('写真の取得に失敗しました', cause);
      setState({ status: 'failed' });
    }
  }

  async function openSettings() {
    try {
      await Linking.openSettings();
    } catch (cause) {
      console.error('設定画面を開けませんでした', cause);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{messages.form.photoLabel}</Text>
      {photoUri !== null ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.preview}
          accessibilityLabel={messages.form.photoPreviewAlt}
          accessible
          testID="catch-form-photo-preview"
        />
      ) : null}
      <View style={styles.buttons}>
        <Pressable
          onPress={() => pick('camera')}
          disabled={disabled || isBusy}
          style={styles.button}
          accessibilityRole="button"
          accessibilityState={{ disabled: disabled || isBusy }}
          testID="catch-form-photo-camera"
        >
          <Text style={styles.buttonText}>{messages.form.takePhoto}</Text>
        </Pressable>
        <Pressable
          onPress={() => pick('library')}
          disabled={disabled || isBusy}
          style={styles.button}
          accessibilityRole="button"
          accessibilityState={{ disabled: disabled || isBusy }}
          testID="catch-form-photo-library"
        >
          <Text style={styles.buttonText}>{messages.form.pickPhoto}</Text>
        </Pressable>
      </View>
      {state.status === 'denied' ? (
        <View style={styles.denied} accessibilityRole="alert" testID="catch-form-photo-denied">
          <Text style={styles.deniedText}>{messages.form.permissionDenied}</Text>
          <Pressable
            onPress={openSettings}
            style={styles.settingsButton}
            accessibilityRole="button"
            testID="catch-form-photo-open-settings"
          >
            <Text style={styles.settingsButtonText}>{messages.form.openSettings}</Text>
          </Pressable>
        </View>
      ) : null}
      {state.status === 'failed' ? (
        <FieldError message={messages.form.photoPickFailed} testID="catch-form-photo-failed" />
      ) : null}
      <FieldError message={error} testID="catch-form-photo-error" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    backgroundColor: colors.skeleton,
    marginBottom: spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: MIN_TAP_SIZE,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  denied: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.dangerSurface,
  },
  deniedText: {
    color: colors.danger,
    fontSize: 14,
  },
  settingsButton: {
    marginTop: spacing.sm,
    minHeight: MIN_TAP_SIZE,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  settingsButtonText: {
    color: colors.onPrimary,
    fontWeight: '600',
  },
});

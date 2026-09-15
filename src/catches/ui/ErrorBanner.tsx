// 失敗の文言と（あれば）復帰の操作を出すバナー（BR4.1、BR4.6）
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, MIN_TAP_SIZE, spacing } from './theme';

type Props = {
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly testID?: string;
};

export function ErrorBanner({ message, actionLabel, onAction, testID }: Props) {
  return (
    <View style={styles.banner} accessibilityRole="alert" testID={testID ?? 'error-banner'}>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={styles.action}
          accessibilityRole="button"
          testID={`${testID ?? 'error-banner'}-action`}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.dangerSurface,
    padding: spacing.md,
    borderRadius: 8,
    margin: spacing.md,
  },
  message: {
    color: colors.danger,
    fontSize: 15,
  },
  action: {
    marginTop: spacing.sm,
    minHeight: MIN_TAP_SIZE,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.danger,
  },
  actionText: {
    color: colors.onPrimary,
    fontWeight: '600',
  },
});

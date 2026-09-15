// 確認ダイアログ（BR3.1 削除、BR7.1 破棄）。承諾したときだけ onConfirm を呼ぶ。
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, MIN_TAP_SIZE, spacing } from './theme';

type Props = {
  readonly visible: boolean;
  readonly title: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly destructive?: boolean;
  readonly testID: string;
};

export function ConfirmDialog({
  visible,
  title,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
  testID,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal testID={testID}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={styles.action}
              accessibilityRole="button"
              testID={`${testID}-cancel`}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={styles.action}
              accessibilityRole="button"
              testID={`${testID}-confirm`}
            >
              <Text style={[styles.confirmText, destructive ? styles.destructiveText : null]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  action: {
    minHeight: MIN_TAP_SIZE,
    minWidth: MIN_TAP_SIZE * 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  confirmText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveText: {
    color: colors.danger,
  },
});

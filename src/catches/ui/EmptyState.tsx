// 釣果が0件のときの表示（WF-2 手順4）
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { messages } from '../messages';
import { colors, MIN_TAP_SIZE, spacing } from './theme';

export function EmptyState({ onAddPress }: { readonly onAddPress: () => void }) {
  return (
    <View style={styles.container} testID="catch-list-empty">
      <Text style={styles.title}>{messages.list.emptyTitle}</Text>
      <Pressable
        onPress={onAddPress}
        style={styles.button}
        accessibilityRole="button"
        testID="catch-list-empty-add"
      >
        <Text style={styles.buttonText}>{messages.list.emptyAction}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  button: {
    minHeight: MIN_TAP_SIZE,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

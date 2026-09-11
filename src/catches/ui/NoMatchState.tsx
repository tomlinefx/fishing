// 絞り込みで該当0件のときの表示（BR2.4）。空の状態とは別の文言で、解除を促す。
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { messages } from '../messages';
import { colors, MIN_TAP_SIZE, spacing } from './theme';

export function NoMatchState({ onClear }: { readonly onClear: () => void }) {
  return (
    <View style={styles.container} testID="catch-list-no-match">
      <Text style={styles.title}>{messages.list.noMatch}</Text>
      <Text style={styles.hint}>{messages.list.noMatchHint}</Text>
      <Pressable
        onPress={onClear}
        style={styles.button}
        accessibilityRole="button"
        testID="catch-list-no-match-clear"
      >
        <Text style={styles.buttonText}>{messages.list.clearFilter}</Text>
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
    color: colors.text,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  button: {
    minHeight: MIN_TAP_SIZE,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});

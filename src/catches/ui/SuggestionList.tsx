// 場所の候補（BR6.1）: 過去の場所名を最大 5 件、タップで入力欄に入れる。
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { messages } from '../messages';
import { colors, MIN_TAP_SIZE, spacing } from './theme';

type Props = {
  readonly suggestions: readonly string[];
  readonly onSelect: (value: string) => void;
};

export function SuggestionList({ suggestions, onSelect }: Props) {
  if (suggestions.length === 0) {
    return null;
  }
  return (
    <View style={styles.container} testID="catch-form-place-suggestions">
      <Text style={styles.label}>{messages.form.placeSuggestions}</Text>
      {suggestions.map((value, index) => (
        <Pressable
          key={value}
          onPress={() => onSelect(value)}
          style={styles.item}
          accessibilityRole="button"
          testID={`catch-form-place-suggestion-${index}`}
        >
          <Text style={styles.itemText} numberOfLines={1}>
            {value}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  item: {
    minHeight: MIN_TAP_SIZE,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  itemText: {
    fontSize: 16,
    color: colors.text,
  },
});

// 項目の直下に出す検証文言（WF-1 手順5）
import { StyleSheet, Text } from 'react-native';
import { colors, spacing } from './theme';

export function FieldError({
  message,
  testID,
}: {
  readonly message?: string;
  readonly testID: string;
}) {
  if (!message) {
    return null;
  }
  return (
    <Text style={styles.text} accessibilityRole="alert" testID={testID}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.xs,
  },
});

// ラベルを上に出す入力欄（プレースホルダーだけにしない、NFR7）＋直下の検証文言
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { FieldError } from './FieldError';
import { colors, MIN_TAP_SIZE, spacing } from './theme';

type Props = {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly testID: string;
  readonly error?: string;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly editable?: boolean;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
};

export function LabeledInput({
  label,
  value,
  onChangeText,
  testID,
  error,
  keyboardType,
  editable = true,
  onFocus,
  onBlur,
}: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label} nativeID={`${testID}-label`}>
        {label}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={editable}
        accessibilityLabel={label}
        accessibilityLabelledBy={`${testID}-label`}
        testID={testID}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <FieldError message={error} testID={`${testID}-error`} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: MIN_TAP_SIZE,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
});

// 画面上部の見出し。h1 相当の見出しと header ランドマーク（NFR7）。
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { messages } from '../messages';
import { colors, MIN_TAP_SIZE, spacing } from './theme';

type Props = {
  readonly title: string;
  /** 指定すると「戻る」ボタンを出す */
  readonly onBack?: () => void;
  readonly backTestID?: string;
};

export function ScreenHeader({ title, onBack, backTestID }: Props) {
  return (
    <View style={styles.header} accessibilityRole="header">
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel={messages.form.back}
          testID={backTestID ?? 'screen-header-back'}
        >
          <Text style={styles.backText}>{`‹ ${messages.form.back}`}</Text>
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  back: {
    minWidth: MIN_TAP_SIZE,
    minHeight: MIN_TAP_SIZE,
    justifyContent: 'center',
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});

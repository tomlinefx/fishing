// 読み込み中に出すカード形の枠（WF-2 手順2）
import { StyleSheet, View } from 'react-native';
import { messages } from '../messages';
import { colors, spacing } from './theme';

const PLACEHOLDER_COUNT = 3;

export function LoadingSkeleton() {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={messages.list.loading}
      testID="catch-list-loading"
    >
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.thumbnail} />
          <View style={styles.lines}>
            <View style={[styles.line, styles.lineWide]} />
            <View style={styles.line} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
  },
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.skeleton,
    marginRight: spacing.md,
  },
  lines: {
    flex: 1,
    justifyContent: 'center',
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.skeleton,
    marginBottom: spacing.sm,
    width: '50%',
  },
  lineWide: {
    width: '80%',
  },
});

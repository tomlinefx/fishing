// 一覧の1件（縮小版の写真、魚種、サイズ/重さ、場所、日付）。未入力は出さず、1行に省略する（BR7.2）。
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Catch } from '../log/catch';
import { formatListDate, formatMeasurements, formatPhotoAltText } from '../log/format';
import { colors, spacing } from './theme';

type Props = {
  readonly catchRecord: Catch;
  readonly now: Date;
  readonly onPress: (id: string) => void;
};

const THUMBNAIL_SIZE = 72;

export function CatchCard({ catchRecord, now, onPress }: Props) {
  const measurements = formatMeasurements(catchRecord);
  const altText = formatPhotoAltText(catchRecord);
  return (
    <Pressable
      onPress={() => onPress(catchRecord.id)}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={altText}
      testID={`catch-list-card-${catchRecord.id}`}
    >
      <Image
        source={{ uri: catchRecord.thumbnailPath }}
        style={styles.thumbnail}
        accessibilityLabel={altText}
        accessible
      />
      <View style={styles.body}>
        {catchRecord.species !== null ? (
          <Text style={styles.species} numberOfLines={1} ellipsizeMode="tail">
            {catchRecord.species}
          </Text>
        ) : null}
        {measurements !== null ? <Text style={styles.detail}>{measurements}</Text> : null}
        {catchRecord.placeName !== null ? (
          <Text style={styles.detail} numberOfLines={1} ellipsizeMode="tail">
            {catchRecord.placeName}
          </Text>
        ) : null}
        <Text style={styles.date}>{formatListDate(catchRecord.caughtAt, now)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    backgroundColor: colors.skeleton,
    marginRight: spacing.md,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  species: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  detail: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

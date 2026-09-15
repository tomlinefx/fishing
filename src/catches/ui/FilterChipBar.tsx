// 絞り込みチップ（ADR-006、BR2.2）: 魚種と場所の候補。もう一度タップで解除。横に収まらなければ横スクロール。
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CatchFilter, FilterOptions } from '../log/catch';
import { messages } from '../messages';
import { colors, MIN_TAP_SIZE, spacing } from './theme';

type Props = {
  readonly options: FilterOptions;
  readonly selected: CatchFilter;
  readonly onToggleSpecies: (value: string) => void;
  readonly onTogglePlace: (value: string) => void;
  readonly onClear: () => void;
};

type ChipRowProps = {
  readonly label: string;
  readonly values: readonly string[];
  readonly selectedValue: string | undefined;
  readonly onToggle: (value: string) => void;
  readonly testIDPrefix: string;
};

function ChipRow({ label, values, selectedValue, onToggle, testIDPrefix }: ChipRowProps) {
  if (values.length === 0) {
    return null;
  }
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {values.map((value) => {
          const isSelected = value === selectedValue;
          return (
            <Pressable
              key={value}
              onPress={() => onToggle(value)}
              style={[styles.chip, isSelected ? styles.chipSelected : null]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${label}: ${value}`}
              testID={`${testIDPrefix}-${value}`}
            >
              <Text
                style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}
                numberOfLines={1}
              >
                {value}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function FilterChipBar({
  options,
  selected,
  onToggleSpecies,
  onTogglePlace,
  onClear,
}: Props) {
  const hasSelection = selected.species !== undefined || selected.placeName !== undefined;
  if (options.species.length === 0 && options.places.length === 0) {
    return null;
  }
  return (
    <View style={styles.bar} testID="filter-chip-bar">
      <ChipRow
        label={messages.list.filterSpecies}
        values={options.species}
        selectedValue={selected.species}
        onToggle={onToggleSpecies}
        testIDPrefix="filter-chip-species"
      />
      <ChipRow
        label={messages.list.filterPlace}
        values={options.places}
        selectedValue={selected.placeName}
        onToggle={onTogglePlace}
        testIDPrefix="filter-chip-place"
      />
      {hasSelection ? (
        <Pressable
          onPress={onClear}
          style={styles.clear}
          accessibilityRole="button"
          testID="filter-chip-clear"
        >
          <Text style={styles.clearText}>{messages.list.clearFilter}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginRight: spacing.sm,
    minWidth: 32,
  },
  chip: {
    minHeight: MIN_TAP_SIZE,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    borderRadius: MIN_TAP_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    maxWidth: 200,
  },
  chipSelected: {
    backgroundColor: colors.chipSelected,
    borderColor: colors.chipSelected,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.chipSelectedText,
    fontWeight: '600',
  },
  clear: {
    minHeight: MIN_TAP_SIZE,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  clearText: {
    color: colors.primary,
    fontSize: 14,
  },
});

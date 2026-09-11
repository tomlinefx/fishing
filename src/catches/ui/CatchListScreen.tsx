// S1 一覧画面（WF-2）: 縮小版の写真カード、絞り込みチップ（AND）、空の状態／該当なし、読み込み失敗と再読み込み。
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Catch, CatchFilter, FilterOptions } from '../log/catch';
import { messages } from '../messages';
import { CatchCard } from './CatchCard';
import { useCatchLog } from './CatchLogContext';
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
import { FilterChipBar } from './FilterChipBar';
import { LoadingSkeleton } from './LoadingSkeleton';
import { NoMatchState } from './NoMatchState';
import { ScreenHeader } from './ScreenHeader';
import { ADD_BUTTON_SIZE, colors, spacing } from './theme';

type LoadOutcome =
  | { readonly status: 'failed'; readonly reason: string }
  | {
      readonly status: 'loaded';
      readonly catches: readonly Catch[];
      readonly options: FilterOptions;
    };

type LoadResult = {
  /** どの取得要求に対する結果か。現在の要求と一致しなければ「読み込み中」 */
  readonly key: string;
  readonly outcome: LoadOutcome;
};

type Props = {
  readonly onAddPress: () => void;
  readonly onCatchPress: (id: string) => void;
  /** 値が変わるたびに再取得する（画面に戻ってきたときに親が増やす）。絞り込みは保持する。 */
  readonly reloadToken?: number;
  /** 表示用の現在時刻（テストで固定する） */
  readonly now?: () => Date;
};

function hasFilter(filter: CatchFilter): boolean {
  return filter.species !== undefined || filter.placeName !== undefined;
}

/** 取得要求を識別する鍵（再読み込み・再試行・絞り込みのどれが変わっても新しい要求になる） */
function buildLoadKey(reloadToken: number, attempt: number, filter: CatchFilter): string {
  return `${reloadToken}:${attempt}:${filter.species ?? ''}:${filter.placeName ?? ''}`;
}

export function CatchListScreen({ onAddPress, onCatchPress, reloadToken = 0, now }: Props) {
  const log = useCatchLog();
  const [filter, setFilter] = useState<CatchFilter>({});
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const loadKey = buildLoadKey(reloadToken, attempt, filter);

  useEffect(() => {
    let cancelled = false;
    const requestKey = buildLoadKey(reloadToken, attempt, filter);
    (async () => {
      const [listed, options] = await Promise.all([
        log.listCatches(filter),
        log.getFilterOptions(),
      ]);
      if (cancelled) {
        return;
      }
      let outcome: LoadOutcome;
      if (!listed.ok) {
        outcome = { status: 'failed', reason: listed.reason };
      } else if (!options.ok) {
        outcome = { status: 'failed', reason: options.reason };
      } else {
        outcome = { status: 'loaded', catches: listed.value, options: options.value };
      }
      setResult({ key: requestKey, outcome });
    })();
    return () => {
      cancelled = true;
    };
  }, [log, reloadToken, attempt, filter]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  const clearFilter = useCallback(() => setFilter({}), []);
  const toggleSpecies = useCallback(
    (value: string) =>
      setFilter((current) => ({
        ...current,
        species: current.species === value ? undefined : value,
      })),
    [],
  );
  const togglePlace = useCallback(
    (value: string) =>
      setFilter((current) => ({
        ...current,
        placeName: current.placeName === value ? undefined : value,
      })),
    [],
  );

  const currentTime = now ? now() : new Date();
  const outcome = result !== null && result.key === loadKey ? result.outcome : null;
  // 読み込み中も直前の候補でチップを出しておく（チップの操作で画面が跳ねないように）
  const lastOptions =
    result?.outcome.status === 'loaded' ? result.outcome.options : { species: [], places: [] };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={messages.list.title} />
      <FilterChipBar
        options={lastOptions}
        selected={filter}
        onToggleSpecies={toggleSpecies}
        onTogglePlace={togglePlace}
        onClear={clearFilter}
      />
      <View style={styles.main} testID="catch-list-main">
        {outcome === null ? <LoadingSkeleton /> : null}
        {outcome?.status === 'failed' ? (
          <ErrorBanner
            message={outcome.reason}
            actionLabel={messages.list.reload}
            onAction={reload}
            testID="catch-list-error"
          />
        ) : null}
        {outcome?.status === 'loaded' && outcome.catches.length === 0 ? (
          hasFilter(filter) ? (
            <NoMatchState onClear={clearFilter} />
          ) : (
            <EmptyState onAddPress={onAddPress} />
          )
        ) : null}
        {outcome?.status === 'loaded' && outcome.catches.length > 0 ? (
          <FlatList
            data={outcome.catches}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CatchCard catchRecord={item} now={currentTime} onPress={onCatchPress} />
            )}
            contentContainerStyle={styles.listContent}
            testID="catch-list"
          />
        ) : null}
      </View>
      <Pressable
        onPress={onAddPress}
        style={styles.addButton}
        accessibilityRole="button"
        accessibilityLabel={messages.list.addButton}
        testID="catch-list-add-button"
      >
        <Text style={styles.addButtonText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  main: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: ADD_BUTTON_SIZE + spacing.xl * 2,
  },
  addButton: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: ADD_BUTTON_SIZE,
    height: ADD_BUTTON_SIZE,
    borderRadius: ADD_BUTTON_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  addButtonText: {
    color: colors.onPrimary,
    fontSize: 28,
    lineHeight: 32,
  },
});

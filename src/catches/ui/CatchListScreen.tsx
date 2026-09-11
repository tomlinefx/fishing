// S1 一覧画面（WF-2）。スケルトン段階: 文字カード・空の状態・（＋）・読み込み失敗と再読み込み。
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Catch, FilterOptions } from '../log/catch';
import { messages } from '../messages';
import { CatchCard } from './CatchCard';
import { useCatchLog } from './CatchLogContext';
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
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
  /** 値が変わるたびに再取得する（画面に戻ってきたときに親が増やす） */
  readonly reloadToken?: number;
  /** 表示用の現在時刻（テストで固定する） */
  readonly now?: () => Date;
};

export function CatchListScreen({ onAddPress, onCatchPress, reloadToken = 0, now }: Props) {
  const log = useCatchLog();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const loadKey = `${reloadToken}:${attempt}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [listed, options] = await Promise.all([log.listCatches({}), log.getFilterOptions()]);
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
      setResult({ key: loadKey, outcome });
    })();
    return () => {
      cancelled = true;
    };
  }, [log, loadKey]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  const currentTime = now ? now() : new Date();
  const outcome = result !== null && result.key === loadKey ? result.outcome : null;

  return (
    <View style={styles.screen}>
      <ScreenHeader title={messages.list.title} />
      <View style={styles.main} testID="catch-list-main">
        {outcome === null ? (
          <View style={styles.center} testID="catch-list-loading">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}
        {outcome?.status === 'failed' ? (
          <ErrorBanner
            message={outcome.reason}
            actionLabel={messages.list.reload}
            onAction={reload}
            testID="catch-list-error"
          />
        ) : null}
        {outcome?.status === 'loaded' && outcome.catches.length === 0 ? (
          <EmptyState onAddPress={onAddPress} />
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

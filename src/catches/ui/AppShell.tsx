// AppShell: 起動時に保存領域を準備し、致命的エラーなら文言を出して止まる（WF-4、BR4.5）。
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { CatchLog } from '../log/catch-log';
import { messages } from '../messages';
import { CatchLogProvider } from './CatchLogContext';
import { colors, spacing } from './theme';

type ShellState =
  | { readonly status: 'initializing' }
  | { readonly status: 'ready'; readonly log: CatchLog }
  | { readonly status: 'fatal'; readonly reason: string };

type Props = {
  /** CatchLog を組み立てる（データベースを開く処理を含むため非同期） */
  readonly createLog: () => Promise<CatchLog>;
  readonly children: ReactNode;
};

export function AppShell({ createLog, children }: Props) {
  const [state, setState] = useState<ShellState>({ status: 'initializing' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const log = await createLog();
        const prepared = await log.prepareStorage();
        if (cancelled) {
          return;
        }
        setState(
          prepared.ok ? { status: 'ready', log } : { status: 'fatal', reason: prepared.reason },
        );
      } catch (cause) {
        // データベースを開く段階の失敗も致命的として扱う（fail fast）
        console.error('CatchLog の組み立てに失敗しました', cause);
        if (!cancelled) {
          setState({ status: 'fatal', reason: messages.app.storageInitFailed });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [createLog]);

  if (state.status === 'initializing') {
    return (
      <View style={styles.center} testID="app-initializing">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (state.status === 'fatal') {
    return (
      <View style={styles.center} accessibilityRole="alert">
        <Text style={styles.fatal} testID="app-fatal-error">
          {state.reason}
        </Text>
      </View>
    );
  }

  return <CatchLogProvider log={state.log}>{children}</CatchLogProvider>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  fatal: {
    color: colors.danger,
    fontSize: 16,
    textAlign: 'center',
  },
});

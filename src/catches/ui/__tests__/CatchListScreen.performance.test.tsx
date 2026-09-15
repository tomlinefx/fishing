// NFR1（一覧は開いてから1秒以内に表示、500件でも軽快）の画面側の実測。
import { render, screen, waitFor } from '@testing-library/react-native';
import { FIXED_NOW, makeCatch } from '../../__tests__/fixtures';
import { startStopwatch } from '../../__tests__/stopwatch';
import { createTestCatchLog } from '../../__tests__/test-catch-log';
import type { Catch } from '../../log/catch';
import { CatchListScreen } from '../CatchListScreen';
import { CatchLogProvider } from '../CatchLogContext';

/** NFR1 の上限（ミリ秒）。requirements.md の「1秒以内」。 */
const RENDER_BUDGET_MS = 1000;
/** NFR1 の件数。requirements.md の「500件」。 */
const ROW_COUNT = 500;

const SPECIES = ['アジ', 'メバル', 'カサゴ', 'シーバス', 'サバ'] as const;
const PLACES = ['テスト堤防', 'テスト海釣り施設', 'テスト港', 'テスト磯'] as const;

function makeRows(count: number): Catch[] {
  const base = new Date(2026, 0, 1, 6, 0, 0).getTime();
  return Array.from({ length: count }, (_, index) =>
    makeCatch({
      id: `perf-${String(index).padStart(4, '0')}`,
      species: SPECIES[index % SPECIES.length],
      placeName: PLACES[index % PLACES.length],
      caughtAt: new Date(base + index * 60_000),
    }),
  );
}

function cardTestId(index: number): string {
  return `catch-list-card-perf-${String(index).padStart(4, '0')}`;
}

async function renderList(rows: readonly Catch[]) {
  const harness = createTestCatchLog(rows);
  return render(
    <CatchLogProvider log={harness.log}>
      <CatchListScreen
        onAddPress={() => undefined}
        onCatchPress={() => undefined}
        now={() => FIXED_NOW}
      />
    </CatchLogProvider>,
  );
}

describe('NFR1 一覧画面の表示時間（500件）', () => {
  it(`${ROW_COUNT} 件の一覧が ${RENDER_BUDGET_MS}ms 以内に表示される`, async () => {
    // ならし: キャッシュが空の CI では初回描画に部品の読み込み時間が乗るので、
    // 1件だけ描画して読み込みを済ませてから計測する（測りたいのは描画の速さ）。
    const warmup = await renderList(makeRows(1));
    await waitFor(() => {
      expect(screen.getByTestId(cardTestId(0))).toBeTruthy();
    });
    await warmup.unmount();

    const elapsed = startStopwatch();
    await renderList(makeRows(ROW_COUNT));
    await waitFor(() => {
      expect(screen.getByTestId(cardTestId(ROW_COUNT - 1))).toBeTruthy();
    });
    const elapsedMs = elapsed();

    // eslint-disable-next-line no-console -- 計測値を Build and Test の証跡として残す
    console.log(`[NFR1] 一覧画面の表示（${ROW_COUNT}件）: ${elapsedMs.toFixed(1)}ms`);
    expect(elapsedMs).toBeLessThan(RENDER_BUDGET_MS);
  });
});

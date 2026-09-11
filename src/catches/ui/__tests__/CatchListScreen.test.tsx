import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FIXED_NOW, makeCatch } from '../../__tests__/fixtures';
import { createTestCatchLog, type TestCatchLog } from '../../__tests__/test-catch-log';
import type { Catch } from '../../log/catch';
import { messages } from '../../messages';
import { CatchListScreen } from '../CatchListScreen';
import { CatchLogProvider } from '../CatchLogContext';

type Handlers = {
  onAddPress?: () => void;
  onCatchPress?: (id: string) => void;
  reloadToken?: number;
};

function listElement(harness: TestCatchLog, handlers: Handlers) {
  return (
    <CatchLogProvider log={harness.log}>
      <CatchListScreen
        onAddPress={handlers.onAddPress ?? (() => undefined)}
        onCatchPress={handlers.onCatchPress ?? (() => undefined)}
        reloadToken={handlers.reloadToken}
        now={() => FIXED_NOW}
      />
    </CatchLogProvider>
  );
}

async function renderList(
  rows: readonly Catch[] = [],
  handlers: Handlers = {},
): Promise<TestCatchLog> {
  const harness = createTestCatchLog(rows);
  await render(listElement(harness, handlers));
  return harness;
}

const THREE_ROWS = [
  makeCatch({
    id: 'c1',
    caughtAt: new Date(2026, 8, 1),
    species: 'テストアジ',
    placeName: 'テスト堤防',
  }),
  makeCatch({
    id: 'c2',
    caughtAt: new Date(2026, 8, 5),
    species: 'テストサバ',
    placeName: 'テスト堤防',
  }),
  makeCatch({
    id: 'c3',
    caughtAt: new Date(2026, 8, 10),
    species: 'テストアジ',
    placeName: 'テスト磯',
  }),
];

function visibleCardIds(): string[] {
  return screen.getAllByTestId(/^catch-list-card-/).map((card) => card.props.testID as string);
}

describe('CatchListScreen（S1）: 表示', () => {
  it('読み込み中はカード形の枠を出し、釣果が0件なら空の状態を出す（WF-2）', async () => {
    const harness = createTestCatchLog([]);
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = harness.log.listCatches.bind(harness.log);
    harness.log.listCatches = async (filter) => {
      await gate;
      return original(filter);
    };
    await render(listElement(harness, {}));
    expect(screen.getByTestId('catch-list-loading')).toBeTruthy();
    release();
    await waitFor(() => expect(screen.getByTestId('catch-list-empty')).toBeTruthy());
    expect(screen.getByText(messages.list.emptyTitle)).toBeTruthy();
    expect(screen.queryByTestId('catch-list-loading')).toBeNull();
    expect(screen.queryByTestId('filter-chip-bar')).toBeNull(); // 候補がなければチップも出さない
  });

  it('カードを新しい順に並べ、未入力の項目は出さない（BR2.1、BR7.2）', async () => {
    await renderList([
      makeCatch({ id: 'old', caughtAt: new Date(2026, 8, 1), species: 'テストアジ' }),
      makeCatch({
        id: 'new',
        caughtAt: new Date(2025, 11, 31),
        species: 'テストサバ',
        sizeCm: null,
        weightG: null,
        placeName: null,
      }),
      makeCatch({ id: 'newest', caughtAt: new Date(2026, 8, 10), species: 'テストイワシ' }),
    ]);
    await waitFor(() => expect(screen.getByTestId('catch-list')).toBeTruthy());
    expect(visibleCardIds()).toEqual([
      'catch-list-card-newest',
      'catch-list-card-old',
      'catch-list-card-new',
    ]);
    expect(screen.getAllByText('25.5cm / 120g')).toHaveLength(2); // old と newest のみ
    expect(screen.getByText('2025/12/31')).toBeTruthy(); // 当年以外は年付き
    expect(screen.getByText('9/10')).toBeTruthy(); // 当年は M/D
    expect(screen.getByTestId('catch-list-card-old').props.accessibilityLabel).toBe(
      'テストアジ 25.5cm テスト釣り場 の写真',
    );
  });

  it('読み込みに失敗すると文言と再読み込みを出し、再読み込みで復帰する（BR4.6）', async () => {
    const harness = createTestCatchLog([makeCatch({ id: 'c1' })]);
    harness.store.failWith('listCatches', 'DB が壊れている');
    await render(listElement(harness, {}));
    await waitFor(() => expect(screen.getByTestId('catch-list-error')).toBeTruthy());
    expect(screen.getByText(messages.list.loadFailed)).toBeTruthy();
    await fireEvent.press(screen.getByText(messages.list.reload));
    await waitFor(() => expect(screen.getByTestId('catch-list-card-c1')).toBeTruthy());
  });

  it('候補の読み込みに失敗しても読み込み失敗として扱う', async () => {
    const harness = createTestCatchLog([makeCatch({ id: 'c1' })]);
    harness.store.failWith('listDistinctValues', '候補が読めない');
    await render(listElement(harness, {}));
    await waitFor(() => expect(screen.getByTestId('catch-list-error')).toBeTruthy());
  });

  it('（＋）と空の状態のボタンで登録へ進む', async () => {
    const onAddPress = jest.fn();
    await renderList([], { onAddPress });
    await waitFor(() => expect(screen.getByTestId('catch-list-empty')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('catch-list-add-button'));
    await fireEvent.press(screen.getByTestId('catch-list-empty-add'));
    expect(onAddPress).toHaveBeenCalledTimes(2);
  });

  it('カードをタップすると詳細へ id を渡す（WF-3 の起点）', async () => {
    const onCatchPress = jest.fn();
    await renderList([makeCatch({ id: 'tap-me' })], { onCatchPress });
    await waitFor(() => expect(screen.getByTestId('catch-list-card-tap-me')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('catch-list-card-tap-me'));
    expect(onCatchPress).toHaveBeenCalledWith('tap-me');
  });
});

describe('CatchListScreen（S1）: 絞り込み', () => {
  it('チップは登録済みの魚種・場所を重複なく出す（BR2.3）', async () => {
    await renderList(THREE_ROWS);
    await waitFor(() => expect(screen.getByTestId('filter-chip-bar')).toBeTruthy());
    expect(screen.getAllByTestId(/^filter-chip-species-/)).toHaveLength(2);
    expect(screen.getAllByTestId(/^filter-chip-place-/)).toHaveLength(2);
    expect(screen.queryByTestId('filter-chip-clear')).toBeNull();
  });

  it('魚種と場所のチップで AND 絞り込みし、もう一度タップで解除する（BR2.2）', async () => {
    await renderList(THREE_ROWS);
    await waitFor(() => expect(screen.getByTestId('catch-list')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('filter-chip-species-テストアジ'));
    await waitFor(() =>
      expect(visibleCardIds()).toEqual(['catch-list-card-c3', 'catch-list-card-c1']),
    );
    expect(screen.getByTestId('filter-chip-species-テストアジ')).toBeSelected();

    await fireEvent.press(screen.getByTestId('filter-chip-place-テスト堤防'));
    await waitFor(() => expect(visibleCardIds()).toEqual(['catch-list-card-c1']));

    // 魚種チップをもう一度タップすると魚種の絞り込みだけ解除
    await fireEvent.press(screen.getByTestId('filter-chip-species-テストアジ'));
    await waitFor(() =>
      expect(visibleCardIds()).toEqual(['catch-list-card-c2', 'catch-list-card-c1']),
    );

    // 「絞り込みを解除」で全件に戻る
    await fireEvent.press(screen.getByTestId('filter-chip-clear'));
    await waitFor(() => expect(visibleCardIds()).toHaveLength(3));
    expect(screen.queryByTestId('filter-chip-clear')).toBeNull();
  });

  it('絞り込みで該当が0件なら空の状態とは別の文言を出し、解除で戻る（BR2.4）', async () => {
    await renderList(THREE_ROWS);
    await waitFor(() => expect(screen.getByTestId('catch-list')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('filter-chip-species-テストサバ'));
    await fireEvent.press(screen.getByTestId('filter-chip-place-テスト磯'));
    await waitFor(() => expect(screen.getByTestId('catch-list-no-match')).toBeTruthy());
    expect(screen.getByText(messages.list.noMatch)).toBeTruthy();
    expect(screen.queryByTestId('catch-list-empty')).toBeNull();
    await fireEvent.press(screen.getByTestId('catch-list-no-match-clear'));
    await waitFor(() => expect(visibleCardIds()).toHaveLength(3));
  });

  it('画面に戻ってきたとき（reloadToken の変化）は絞り込みを保持したまま再取得する', async () => {
    const harness = createTestCatchLog(THREE_ROWS);
    const { rerender } = await render(listElement(harness, { reloadToken: 0 }));
    await waitFor(() => expect(screen.getByTestId('catch-list')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('filter-chip-place-テスト磯'));
    await waitFor(() => expect(visibleCardIds()).toEqual(['catch-list-card-c3']));

    // 登録画面で1件増えた想定
    await harness.store.insertCatch(
      makeCatch({ id: 'c4', caughtAt: new Date(2026, 8, 11), placeName: 'テスト磯' }),
    );
    await rerender(listElement(harness, { reloadToken: 1 }));
    await waitFor(() =>
      expect(visibleCardIds()).toEqual(['catch-list-card-c4', 'catch-list-card-c3']),
    );
    expect(screen.getByTestId('filter-chip-place-テスト磯')).toBeSelected();
  });
});

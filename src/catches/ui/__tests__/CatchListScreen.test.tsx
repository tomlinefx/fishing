import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FIXED_NOW, makeCatch } from '../../__tests__/fixtures';
import { createTestCatchLog, type TestCatchLog } from '../../__tests__/test-catch-log';
import type { Catch } from '../../log/catch';
import { messages } from '../../messages';
import { CatchListScreen } from '../CatchListScreen';
import { CatchLogProvider } from '../CatchLogContext';

type Handlers = { onAddPress?: () => void; onCatchPress?: (id: string) => void };

async function renderList(
  rows: readonly Catch[] = [],
  handlers: Handlers = {},
): Promise<TestCatchLog> {
  const harness = createTestCatchLog(rows);
  await render(
    <CatchLogProvider log={harness.log}>
      <CatchListScreen
        onAddPress={handlers.onAddPress ?? (() => undefined)}
        onCatchPress={handlers.onCatchPress ?? (() => undefined)}
        now={() => FIXED_NOW}
      />
    </CatchLogProvider>,
  );
  return harness;
}

describe('CatchListScreen（S1）', () => {
  it('釣果が0件なら空の状態を出す（WF-2 手順4）', async () => {
    await renderList([]);
    await waitFor(() => expect(screen.getByTestId('catch-list-empty')).toBeTruthy());
    expect(screen.getByText(messages.list.emptyTitle)).toBeTruthy();
    expect(screen.queryByTestId('catch-list-loading')).toBeNull();
  });

  it('カードを新しい順に並べ、未入力の項目は出さない（BR2.1、BR7.2）', async () => {
    await renderList([
      makeCatch({ id: 'old', caughtAt: new Date(2026, 8, 1), species: 'テストアジ' }),
      makeCatch({
        id: 'new',
        caughtAt: new Date(2026, 8, 10),
        species: 'テストサバ',
        sizeCm: null,
        weightG: null,
        placeName: null,
      }),
    ]);
    await waitFor(() => expect(screen.getByTestId('catch-list')).toBeTruthy());
    const cards = screen.getAllByTestId(/^catch-list-card-/);
    expect(cards.map((card) => card.props.testID)).toEqual([
      'catch-list-card-new',
      'catch-list-card-old',
    ]);
    expect(screen.getByText('テストサバ')).toBeTruthy();
    expect(screen.getByText('25.5cm / 120g')).toBeTruthy(); // old のサイズ／重さ
    expect(screen.getByText('テスト釣り場')).toBeTruthy(); // old の場所
    expect(screen.getAllByText(/cm/)).toHaveLength(1); // new は未入力なので出ない
    expect(screen.getByText('9/10')).toBeTruthy(); // 当年は M/D
  });

  it('読み込みに失敗すると文言と再読み込みを出し、再読み込みで復帰する（BR4.6）', async () => {
    const harness = createTestCatchLog([makeCatch({ id: 'c1' })]);
    harness.store.failWith('listCatches', 'DB が壊れている');
    await render(
      <CatchLogProvider log={harness.log}>
        <CatchListScreen onAddPress={() => undefined} onCatchPress={() => undefined} />
      </CatchLogProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('catch-list-error')).toBeTruthy());
    expect(screen.getByText(messages.list.loadFailed)).toBeTruthy();
    await fireEvent.press(screen.getByText(messages.list.reload));
    await waitFor(() => expect(screen.getByTestId('catch-list-card-c1')).toBeTruthy());
  });

  it('候補の読み込みに失敗しても読み込み失敗として扱う', async () => {
    const harness = createTestCatchLog([makeCatch({ id: 'c1' })]);
    harness.store.failWith('listDistinctValues', '候補が読めない');
    await render(
      <CatchLogProvider log={harness.log}>
        <CatchListScreen onAddPress={() => undefined} onCatchPress={() => undefined} />
      </CatchLogProvider>,
    );
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

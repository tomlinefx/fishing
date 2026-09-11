import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { makeCatch } from '../../__tests__/fixtures';
import { createTestCatchLog, type TestCatchLog } from '../../__tests__/test-catch-log';
import type { Catch } from '../../log/catch';
import { messages } from '../../messages';
import { CatchDetailScreen } from '../CatchDetailScreen';
import { CatchLogProvider } from '../CatchLogContext';

type Handlers = { onBack?: () => void; onDeleted?: () => void };

async function renderDetail(
  id: string,
  rows: readonly Catch[],
  handlers: Handlers = {},
): Promise<TestCatchLog> {
  const harness = createTestCatchLog(rows);
  await render(
    <CatchLogProvider log={harness.log}>
      <CatchDetailScreen
        id={id}
        onBack={handlers.onBack ?? (() => undefined)}
        onDeleted={handlers.onDeleted ?? (() => undefined)}
      />
    </CatchLogProvider>,
  );
  return harness;
}

describe('CatchDetailScreen（S3）', () => {
  it('原本の写真と項目を出し、未入力の項目は出さない（WF-3、BR7.2）', async () => {
    await renderDetail('c1', [
      makeCatch({
        id: 'c1',
        species: 'テストアジ',
        sizeCm: 25.5,
        weightG: null,
        placeName: null,
        caughtAt: new Date(2026, 8, 11, 14, 5),
      }),
    ]);
    await waitFor(() => expect(screen.getByTestId('catch-detail-main')).toBeTruthy());
    expect(screen.getByTestId('catch-detail-photo').props.source).toEqual({
      uri: 'photos/c1.jpg',
    });
    expect(screen.getByTestId('catch-detail-photo').props.accessibilityLabel).toBe(
      'テストアジ 25.5cm の写真',
    );
    expect(screen.getAllByText('テストアジ').length).toBeGreaterThanOrEqual(1); // 見出しと項目
    expect(screen.getByText('25.5cm')).toBeTruthy();
    expect(screen.getByText('2026/9/11 14:05')).toBeTruthy();
    expect(screen.queryByText(messages.detail.weightLabel)).toBeNull();
    expect(screen.queryByText(messages.detail.placeLabel)).toBeNull();
  });

  it('魚種が未入力なら見出しは「釣果」になる', async () => {
    await renderDetail('c1', [makeCatch({ id: 'c1', species: null })]);
    await waitFor(() => expect(screen.getByTestId('catch-detail-main')).toBeTruthy());
    expect(screen.getByText(messages.detail.untitled)).toBeTruthy();
  });

  it('削除の確認でキャンセルすると何も起きない（BR3.1）', async () => {
    const onDeleted = jest.fn();
    const harness = await renderDetail('c1', [makeCatch({ id: 'c1' })], { onDeleted });
    await waitFor(() => expect(screen.getByTestId('catch-detail-delete')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('catch-detail-delete'));
    expect(screen.getByText(messages.detail.deleteConfirmTitle)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('catch-detail-delete-dialog-cancel'));
    expect(onDeleted).not.toHaveBeenCalled();
    expect(harness.store.rows).toHaveLength(1);
  });

  it('削除を承諾すると削除して一覧へ戻る（BR3.1、BR3.2）', async () => {
    const onDeleted = jest.fn();
    const harness = await renderDetail('c1', [makeCatch({ id: 'c1' })], { onDeleted });
    await waitFor(() => expect(screen.getByTestId('catch-detail-delete')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('catch-detail-delete'));
    await fireEvent.press(screen.getByTestId('catch-detail-delete-dialog-confirm'));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(harness.store.deletedIds).toEqual(['c1']);
  });

  it('削除に失敗すると「削除できませんでした」を出して留まる', async () => {
    const onDeleted = jest.fn();
    const harness = await renderDetail('c1', [makeCatch({ id: 'c1' })], { onDeleted });
    await waitFor(() => expect(screen.getByTestId('catch-detail-delete')).toBeTruthy());
    harness.store.failWith('deleteCatch', '消せない');
    await fireEvent.press(screen.getByTestId('catch-detail-delete'));
    await fireEvent.press(screen.getByTestId('catch-detail-delete-dialog-confirm'));
    await waitFor(() =>
      expect(screen.getByTestId('catch-detail-delete-error')).toHaveTextContent(
        messages.detail.deleteFailed,
      ),
    );
    expect(onDeleted).not.toHaveBeenCalled();
    expect(screen.getByTestId('catch-detail-delete')).toBeEnabled();
  });

  it('読み込みに失敗すると「表示できませんでした」と「戻る」を出す', async () => {
    const onBack = jest.fn();
    const harness = createTestCatchLog([makeCatch({ id: 'c1' })]);
    harness.store.failWith('findCatch', '読めない');
    await render(
      <CatchLogProvider log={harness.log}>
        <CatchDetailScreen id="c1" onBack={onBack} onDeleted={() => undefined} />
      </CatchLogProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('catch-detail-load-error')).toBeTruthy());
    expect(screen.getByText(messages.detail.loadFailed)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('catch-detail-load-error-action'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('見つからない id でも「表示できませんでした」を出す', async () => {
    await renderDetail('missing', [makeCatch({ id: 'c1' })]);
    await waitFor(() => expect(screen.getByTestId('catch-detail-load-error')).toBeTruthy());
    expect(screen.queryByTestId('catch-detail-main')).toBeNull();
  });

  it('見出しの戻るで onBack が呼ばれる', async () => {
    const onBack = jest.fn();
    await renderDetail('c1', [makeCatch({ id: 'c1' })], { onBack });
    await fireEvent.press(screen.getByTestId('catch-detail-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

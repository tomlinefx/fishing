import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { createTestCatchLog, type TestCatchLog } from '../../__tests__/test-catch-log';
import { messages } from '../../messages';
import { CatchFormScreen } from '../CatchFormScreen';
import { CatchLogProvider } from '../CatchLogContext';

type Handlers = { onSaved?: () => void; onCancel?: () => void; initialPhotoUri?: string | null };

async function renderForm(handlers: Handlers = {}): Promise<TestCatchLog> {
  const harness = createTestCatchLog();
  await render(
    <CatchLogProvider log={harness.log}>
      <CatchFormScreen
        onSaved={handlers.onSaved ?? (() => undefined)}
        onCancel={handlers.onCancel ?? (() => undefined)}
        initialPhotoUri={handlers.initialPhotoUri ?? 'file:///tmp/test-photo.jpg'}
      />
    </CatchLogProvider>,
  );
  return harness;
}

describe('CatchFormScreen（S2）', () => {
  it('入力して保存すると保存され、onSaved が呼ばれる（WF-1 正常系）', async () => {
    const onSaved = jest.fn();
    const harness = await renderForm({ onSaved });
    await fireEvent.changeText(screen.getByTestId('catch-form-species'), 'テストアジ');
    await fireEvent.changeText(screen.getByTestId('catch-form-size'), '25.5');
    await fireEvent.changeText(screen.getByTestId('catch-form-weight'), '120');
    await fireEvent.changeText(screen.getByTestId('catch-form-place'), 'テスト釣り場');
    await fireEvent.press(screen.getByTestId('catch-form-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(harness.store.rows).toHaveLength(1);
    expect(harness.store.rows[0]).toMatchObject({
      species: 'テストアジ',
      sizeCm: 25.5,
      weightG: 120,
      placeName: 'テスト釣り場',
    });
  });

  it('サイズが不正なら項目の直下に文言を出し、保存しない（BR1.2）', async () => {
    const harness = await renderForm();
    await fireEvent.changeText(screen.getByTestId('catch-form-size'), 'abc');
    await fireEvent.press(screen.getByTestId('catch-form-save'));
    await waitFor(() =>
      expect(screen.getByTestId('catch-form-size-error')).toHaveTextContent(
        messages.errors.sizeInvalid,
      ),
    );
    expect(harness.store.rows).toHaveLength(0);
    // 修正すると文言が消える
    await fireEvent.changeText(screen.getByTestId('catch-form-size'), '25');
    expect(screen.queryByTestId('catch-form-size-error')).toBeNull();
  });

  it('保存に失敗すると上部に文言を出し、入力を保持する（BR4.1）', async () => {
    const harness = await renderForm();
    harness.store.failWith('insertCatch', '書けない');
    await fireEvent.changeText(screen.getByTestId('catch-form-species'), 'テストアジ');
    await fireEvent.press(screen.getByTestId('catch-form-save'));
    await waitFor(() =>
      expect(screen.getByTestId('catch-form-save-error')).toHaveTextContent(
        messages.errors.saveFailed,
      ),
    );
    expect(screen.getByTestId('catch-form-species').props.value).toBe('テストアジ');
    expect(screen.getByTestId('catch-form-save')).toHaveTextContent(messages.form.save);
  });

  it('戻るで onCancel が呼ばれる', async () => {
    const onCancel = jest.fn();
    await renderForm({ onCancel });
    await fireEvent.press(screen.getByTestId('catch-form-back'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

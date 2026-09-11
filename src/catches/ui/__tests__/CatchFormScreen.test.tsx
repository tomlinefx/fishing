import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { BackHandler } from 'react-native';
import { makeCatch } from '../../__tests__/fixtures';
import { createTestCatchLog, type TestCatchLog } from '../../__tests__/test-catch-log';
import type { Catch } from '../../log/catch';
import { messages } from '../../messages';
import { CatchFormScreen } from '../CatchFormScreen';
import { CatchLogProvider } from '../CatchLogContext';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({ openSettings: jest.fn(async () => undefined) }));

const PICKED_URI = 'file:///cache/picked.jpg';

function grantCameraWithPhoto(uri = PICKED_URI) {
  jest
    .mocked(ImagePicker.requestCameraPermissionsAsync)
    .mockResolvedValue({ granted: true } as never);
  jest
    .mocked(ImagePicker.launchCameraAsync)
    .mockResolvedValue({ canceled: false, assets: [{ uri }] } as never);
}

type Handlers = { onSaved?: () => void; onCancel?: () => void };

async function renderForm(
  handlers: Handlers = {},
  rows: readonly Catch[] = [],
): Promise<TestCatchLog> {
  const harness = createTestCatchLog(rows);
  await render(
    <CatchLogProvider log={harness.log}>
      <CatchFormScreen
        onSaved={handlers.onSaved ?? (() => undefined)}
        onCancel={handlers.onCancel ?? (() => undefined)}
      />
    </CatchLogProvider>,
  );
  return harness;
}

async function attachPhoto() {
  await fireEvent.press(screen.getByTestId('catch-form-photo-camera'));
  await waitFor(() => expect(screen.getByTestId('catch-form-photo-preview')).toBeTruthy());
}

beforeEach(() => {
  jest.mocked(ImagePicker.requestCameraPermissionsAsync).mockReset();
  jest.mocked(ImagePicker.launchCameraAsync).mockReset();
});

describe('CatchFormScreen（S2）: 保存', () => {
  it('写真を添付して入力し保存すると保存され、onSaved が呼ばれる（WF-1 正常系）', async () => {
    grantCameraWithPhoto();
    const onSaved = jest.fn();
    const harness = await renderForm({ onSaved });
    await attachPhoto();
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
      photoPath: 'photos/test-id-1.jpg',
    });
  });

  it('写真なしで保存すると「写真を添付してください」を出し、保存しない（BR1.1）', async () => {
    const harness = await renderForm();
    await fireEvent.changeText(screen.getByTestId('catch-form-species'), 'テストアジ');
    await fireEvent.press(screen.getByTestId('catch-form-save'));
    await waitFor(() =>
      expect(screen.getByTestId('catch-form-photo-error')).toHaveTextContent(
        messages.errors.photoRequired,
      ),
    );
    expect(harness.store.rows).toHaveLength(0);
    // 写真を添付すると文言が消える
    grantCameraWithPhoto();
    await attachPhoto();
    expect(screen.queryByTestId('catch-form-photo-error')).toBeNull();
  });

  it('サイズが不正なら項目の直下に文言を出し、修正すると消える（BR1.2）', async () => {
    grantCameraWithPhoto();
    const harness = await renderForm();
    await attachPhoto();
    await fireEvent.changeText(screen.getByTestId('catch-form-size'), 'abc');
    await fireEvent.press(screen.getByTestId('catch-form-save'));
    await waitFor(() =>
      expect(screen.getByTestId('catch-form-size-error')).toHaveTextContent(
        messages.errors.sizeInvalid,
      ),
    );
    expect(harness.store.rows).toHaveLength(0);
    await fireEvent.changeText(screen.getByTestId('catch-form-size'), '25');
    expect(screen.queryByTestId('catch-form-size-error')).toBeNull();
  });

  it('保存中は「保存中...」で無効になり、二重に保存されない（BR4.2）', async () => {
    grantCameraWithPhoto();
    const harness = await renderForm();
    let finish: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const originalInsert = harness.store.insertCatch.bind(harness.store);
    harness.store.insertCatch = async (row) => {
      await gate;
      return originalInsert(row);
    };
    await attachPhoto();
    // 保存が完了するまで press の Promise は解決しないので、ここでは待たない
    const firstPress = fireEvent.press(screen.getByTestId('catch-form-save'));
    await waitFor(() =>
      expect(screen.getByTestId('catch-form-save')).toHaveTextContent(messages.form.saving),
    );
    expect(screen.getByTestId('catch-form-save')).toBeDisabled();
    const secondPress = fireEvent.press(screen.getByTestId('catch-form-save'));
    finish();
    await Promise.all([firstPress, secondPress]);
    await waitFor(() => expect(harness.store.rows).toHaveLength(1));
    expect(harness.store.calls.insertCatch).toBe(1);
  });

  it('保存に失敗すると上部に文言を出し、入力と写真を保持する（BR4.1）', async () => {
    grantCameraWithPhoto();
    const harness = await renderForm();
    harness.store.failWith('insertCatch', '書けない');
    await attachPhoto();
    await fireEvent.changeText(screen.getByTestId('catch-form-species'), 'テストアジ');
    await fireEvent.press(screen.getByTestId('catch-form-save'));
    await waitFor(() =>
      expect(screen.getByTestId('catch-form-save-error')).toHaveTextContent(
        messages.errors.saveFailed,
      ),
    );
    expect(screen.getByTestId('catch-form-species').props.value).toBe('テストアジ');
    expect(screen.getByTestId('catch-form-photo-preview')).toBeTruthy();
    expect(screen.getByTestId('catch-form-save')).toHaveTextContent(messages.form.save);
    expect(screen.getByTestId('catch-form-save')).toBeEnabled();
  });
});

describe('CatchFormScreen（S2）: 戻ると破棄確認', () => {
  it('入力がなければ確認なしで戻る', async () => {
    const onCancel = jest.fn();
    await renderForm({ onCancel });
    await fireEvent.press(screen.getByTestId('catch-form-back'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('catch-form-discard-dialog')).toBeNull();
  });

  it('入力があれば破棄の確認を出し、キャンセルなら留まり、承諾なら戻る（BR7.1）', async () => {
    const onCancel = jest.fn();
    await renderForm({ onCancel });
    await fireEvent.changeText(screen.getByTestId('catch-form-species'), 'テ');
    await fireEvent.press(screen.getByTestId('catch-form-back'));
    expect(screen.getByTestId('catch-form-discard-dialog')).toBeTruthy();
    expect(screen.getByText(messages.form.discardTitle)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('catch-form-discard-dialog-cancel'));
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.queryByTestId('catch-form-discard-dialog')).toBeNull();
    expect(screen.getByTestId('catch-form-species').props.value).toBe('テ');

    await fireEvent.press(screen.getByTestId('catch-form-back'));
    await fireEvent.press(screen.getByTestId('catch-form-discard-dialog-confirm'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('写真だけ添付した状態でも破棄の確認を出す（BR7.1）', async () => {
    grantCameraWithPhoto();
    const onCancel = jest.fn();
    await renderForm({ onCancel });
    await attachPhoto();
    await fireEvent.press(screen.getByTestId('catch-form-back'));
    expect(screen.getByTestId('catch-form-discard-dialog')).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('端末の戻るボタンでも同じ確認になる', async () => {
    const addListener = jest.spyOn(BackHandler, 'addEventListener');
    const onCancel = jest.fn();
    await renderForm({ onCancel });
    await fireEvent.changeText(screen.getByTestId('catch-form-species'), 'テ');
    // 入力の変化で登録し直された最新のハンドラを取り出す
    const handler = addListener.mock.calls.at(-1)?.[1] as (() => boolean) | undefined;
    expect(handler).toBeDefined();
    await act(async () => {
      expect(handler?.()).toBe(true);
    });
    await waitFor(() => expect(screen.getByTestId('catch-form-discard-dialog')).toBeTruthy());
    expect(onCancel).not.toHaveBeenCalled();
    addListener.mockRestore();
  });
});

describe('CatchFormScreen（S2）: 場所の候補', () => {
  const rows = [
    makeCatch({ id: 'p1', caughtAt: new Date(2026, 8, 1), placeName: 'テスト堤防' }),
    makeCatch({ id: 'p2', caughtAt: new Date(2026, 8, 2), placeName: 'テスト磯' }),
    makeCatch({ id: 'p3', caughtAt: new Date(2026, 8, 3), placeName: '別の池' }),
  ];

  it('場所欄にフォーカスすると過去の場所を新しい順に出し、入力で絞られ、タップで入る（BR6.1）', async () => {
    await renderForm({}, rows);
    await fireEvent(screen.getByTestId('catch-form-place'), 'focus');
    await waitFor(() => expect(screen.getByTestId('catch-form-place-suggestions')).toBeTruthy());
    expect(screen.getByTestId('catch-form-place-suggestion-0')).toHaveTextContent('別の池');
    expect(screen.getAllByTestId(/^catch-form-place-suggestion-/)).toHaveLength(3);

    await fireEvent.changeText(screen.getByTestId('catch-form-place'), 'テスト');
    await waitFor(() =>
      expect(screen.getAllByTestId(/^catch-form-place-suggestion-/)).toHaveLength(2),
    );

    await fireEvent.press(screen.getByTestId('catch-form-place-suggestion-1'));
    expect(screen.getByTestId('catch-form-place').props.value).toBe('テスト堤防');
    expect(screen.queryByTestId('catch-form-place-suggestions')).toBeNull();
  });

  it('フォーカスが外れると候補を隠す', async () => {
    await renderForm({}, rows);
    await fireEvent(screen.getByTestId('catch-form-place'), 'focus');
    await waitFor(() => expect(screen.getByTestId('catch-form-place-suggestions')).toBeTruthy());
    await fireEvent(screen.getByTestId('catch-form-place'), 'blur');
    expect(screen.queryByTestId('catch-form-place-suggestions')).toBeNull();
  });
});

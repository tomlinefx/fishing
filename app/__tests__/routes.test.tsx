// app/ のルート配線を expo-router の testing-library で通しで確かめる（一覧 → 登録 → 一覧 → 詳細 → 一覧）。
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import { makeCatch } from '../../src/catches/__tests__/fixtures';
import { createTestCatchLog } from '../../src/catches/__tests__/test-catch-log';
import { AppShell } from '../../src/catches/ui/AppShell';
import CatchDetailRoute from '../catch/[id]';
import IndexRoute from '../index';
import NewCatchRoute from '../new';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file:///cache/shot.jpg' }],
  })),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({ openSettings: jest.fn(async () => undefined) }));

afterEach(() => {
  jest.useRealTimers(); // renderRouter が fake timers を有効にするため元に戻す
});

describe('app/ のルート', () => {
  it('一覧 → 登録して戻ると先頭に出る → 詳細 → 削除で一覧に戻る', async () => {
    const harness = createTestCatchLog([
      makeCatch({ id: 'existing', caughtAt: new Date(2026, 8, 1), species: 'テストサバ' }),
    ]);
    const createLog = async () => harness.log;

    function RootLayout() {
      return (
        <AppShell createLog={createLog}>
          <Stack screenOptions={{ headerShown: false }} />
        </AppShell>
      );
    }

    // RNTL 14 では render が非同期なので、renderRouter の戻り値（getPathname 付き）を保持してから待つ
    const routing = renderRouter(
      {
        _layout: RootLayout,
        index: IndexRoute,
        new: NewCatchRoute,
        'catch/[id]': CatchDetailRoute,
      },
      { initialUrl: '/' },
    );
    await (routing as unknown as Promise<unknown>);

    await waitFor(() => expect(screen.getByTestId('catch-list-card-existing')).toBeTruthy());

    // 登録へ
    await fireEvent.press(screen.getByTestId('catch-list-add-button'));
    await waitFor(() => expect(screen.getByTestId('catch-form-save')).toBeTruthy());
    expect(routing.getPathname()).toBe('/new');
    await fireEvent.press(screen.getByTestId('catch-form-photo-camera'));
    await waitFor(() => expect(screen.getByTestId('catch-form-photo-preview')).toBeTruthy());
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalledTimes(1);
    await fireEvent.changeText(screen.getByTestId('catch-form-species'), 'テストアジ');
    await fireEvent.press(screen.getByTestId('catch-form-save'));

    // 一覧に戻り、保存した釣果が先頭に出る
    await waitFor(() => expect(routing.getPathname()).toBe('/'));
    await waitFor(() => expect(screen.getByTestId('catch-list-card-test-id-1')).toBeTruthy());
    const ids = screen
      .getAllByTestId(/^catch-list-card-/)
      .map((card) => card.props.testID as string);
    expect(ids).toEqual(['catch-list-card-test-id-1', 'catch-list-card-existing']);

    // 詳細へ
    await fireEvent.press(screen.getByTestId('catch-list-card-test-id-1'));
    await waitFor(() => expect(routing.getPathname()).toBe('/catch/test-id-1'));
    await waitFor(() => expect(screen.getByTestId('catch-detail-delete')).toBeTruthy());

    // 削除して一覧に戻ると消えている
    await fireEvent.press(screen.getByTestId('catch-detail-delete'));
    await fireEvent.press(screen.getByTestId('catch-detail-delete-dialog-confirm'));
    await waitFor(() => expect(routing.getPathname()).toBe('/'));
    await waitFor(() => expect(screen.queryByTestId('catch-list-card-test-id-1')).toBeNull());
    expect(screen.getByTestId('catch-list-card-existing')).toBeTruthy();
  });
});

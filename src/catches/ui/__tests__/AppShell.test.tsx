import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { createTestCatchLog } from '../../__tests__/test-catch-log';
import { messages } from '../../messages';
import { AppShell } from '../AppShell';
import { useCatchLog } from '../CatchLogContext';

function Probe() {
  const log = useCatchLog();
  return <Text testID="probe">{typeof log.saveCatch}</Text>;
}

describe('AppShell', () => {
  it('保存領域の準備に成功すると子画面を表示し、CatchLog を渡す（WF-4）', async () => {
    const { log } = createTestCatchLog();
    let resolveCreate: (value: typeof log) => void = () => undefined;
    const pending = new Promise<typeof log>((resolve) => {
      resolveCreate = resolve;
    });
    await render(
      <AppShell createLog={() => pending}>
        <Probe />
      </AppShell>,
    );
    expect(screen.getByTestId('app-initializing')).toBeTruthy();
    resolveCreate(log);
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('function'));
    expect(screen.queryByTestId('app-initializing')).toBeNull();
  });

  it('保存領域の準備に失敗すると致命的エラーの文言を出して止まる（BR4.5）', async () => {
    const { log, store } = createTestCatchLog();
    store.failWith('initialize', 'ディレクトリが作れない');
    await render(
      <AppShell createLog={async () => log}>
        <Probe />
      </AppShell>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('app-fatal-error')).toHaveTextContent(
        messages.app.storageInitFailed,
      ),
    );
    expect(screen.queryByTestId('probe')).toBeNull();
  });

  it('CatchLog の組み立て自体が失敗しても致命的エラーとして表示する', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await render(
      <AppShell
        createLog={async () => {
          throw new Error('DB が開けない');
        }}
      >
        <Probe />
      </AppShell>,
    );
    await waitFor(() => expect(screen.getByTestId('app-fatal-error')).toBeTruthy());
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('useCatchLog は Provider の外では使えない', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(render(<Probe />)).rejects.toThrow('CatchLogProvider');
    errorSpy.mockRestore();
  });
});

// expo-sqlite の呼び出しへの対応付けを、モックで確認する（実機の SQLite は使えない）。
import { createExpoSqliteDriver, DATABASE_NAME, openExpoSqliteDriver } from '../expo-sqlite-driver';

const mockDatabase = {
  execAsync: jest.fn(async () => undefined),
  runAsync: jest.fn(async () => ({ changes: 2, lastInsertRowId: 0 })),
  getAllAsync: jest.fn(async () => [{ id: 'a' }, { id: 'b' }]),
  getFirstAsync: jest.fn(async () => undefined),
  closeAsync: jest.fn(async () => undefined),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => mockDatabase),
}));

describe('createExpoSqliteDriver', () => {
  const driver = createExpoSqliteDriver(mockDatabase as never);

  it('exec と close をそのまま渡す', async () => {
    await driver.exec('CREATE TABLE t (x)');
    expect(mockDatabase.execAsync).toHaveBeenCalledWith('CREATE TABLE t (x)');
    await driver.close();
    expect(mockDatabase.closeAsync).toHaveBeenCalledTimes(1);
  });

  it('run は変更行数を返し、パラメータを配列で渡す', async () => {
    const result = await driver.run('DELETE FROM t WHERE x = ?', ['v']);
    expect(result).toEqual({ changes: 2 });
    expect(mockDatabase.runAsync).toHaveBeenCalledWith('DELETE FROM t WHERE x = ?', ['v']);
  });

  it('all は行の配列を返す（パラメータ省略時は空配列）', async () => {
    const rows = await driver.all<{ id: string }>('SELECT id FROM t');
    expect(rows).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(mockDatabase.getAllAsync).toHaveBeenCalledWith('SELECT id FROM t', []);
  });

  it('get は行がなければ null を返す', async () => {
    const row = await driver.get('SELECT * FROM t WHERE id = ?', ['zzz']);
    expect(row).toBeNull();
    mockDatabase.getFirstAsync.mockResolvedValueOnce({ id: 'a' } as never);
    const found = await driver.get('SELECT * FROM t WHERE id = ?', ['a']);
    expect(found).toEqual({ id: 'a' });
  });
});

describe('openExpoSqliteDriver', () => {
  it('既定のファイル名でデータベースを開く', async () => {
    const { openDatabaseAsync } = jest.requireMock('expo-sqlite') as {
      openDatabaseAsync: jest.Mock;
    };
    const driver = await openExpoSqliteDriver();
    expect(openDatabaseAsync).toHaveBeenCalledWith(DATABASE_NAME);
    await driver.exec('SELECT 1');
    expect(mockDatabase.execAsync).toHaveBeenCalledWith('SELECT 1');
  });
});

import { initializeStorage } from '../init';
import { applySchema, SCHEMA_VERSION } from '../schema';
import { createBrokenSqlDriver, createNodeSqlDriver } from './node-sql-driver';
import { createTempPhotoFileSystem } from './temp-photo-files';

describe('initializeStorage', () => {
  it('ディレクトリとテーブルを作り、版を記録する', async () => {
    const driver = createNodeSqlDriver();
    const files = await createTempPhotoFileSystem();
    const result = await initializeStorage(driver, files);
    expect(result).toEqual({ ok: true, value: undefined });
    expect(await files.exists(`${files.root}/photos`)).toBe(true);
    expect(await files.exists(`${files.root}/thumbnails`)).toBe(true);
    const version = await driver.get<{ version: number }>('SELECT version FROM schema_version');
    expect(version).toEqual({ version: SCHEMA_VERSION });
    await driver.close();
    await files.cleanup();
  });

  it('2回目の初期化は既存のデータを壊さない（FR4.1）', async () => {
    const driver = createNodeSqlDriver();
    const files = await createTempPhotoFileSystem();
    await initializeStorage(driver, files);
    await driver.run(
      'INSERT INTO catches (id, photo_path, thumbnail_path, caught_at) VALUES (?, ?, ?, ?)',
      ['c1', 'p', 't', '2026-09-11T05:05:00.000Z'],
    );
    const again = await initializeStorage(driver, files);
    expect(again.ok).toBe(true);
    const count = await driver.get<{ n: number }>('SELECT COUNT(*) AS n FROM catches');
    expect(count).toEqual({ n: 1 });
    const versions = await driver.all<{ version: number }>('SELECT version FROM schema_version');
    expect(versions).toHaveLength(1);
    await driver.close();
    await files.cleanup();
  });

  it('ディレクトリが作れないと致命的な失敗を返す（BR4.5）', async () => {
    const driver = createNodeSqlDriver();
    const files = await createTempPhotoFileSystem();
    const brokenFiles = {
      ...files,
      ensureDirectories: async () => {
        throw new Error('書き込み不可');
      },
    };
    const result = await initializeStorage(driver, brokenFiles);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.cause).toBeInstanceOf(Error);
    }
    await driver.close();
    await files.cleanup();
  });

  it('データベースが開けないと致命的な失敗を返す（BR4.5）', async () => {
    const files = await createTempPhotoFileSystem();
    const result = await initializeStorage(createBrokenSqlDriver(), files);
    expect(result.ok).toBe(false);
    await files.cleanup();
  });
});

describe('applySchema', () => {
  it('データベースの版がアプリより新しいと開けない', async () => {
    const driver = createNodeSqlDriver();
    await applySchema(driver);
    await driver.run('UPDATE schema_version SET version = ?', [SCHEMA_VERSION + 1]);
    await expect(applySchema(driver)).rejects.toThrow('より新しい');
    await driver.close();
  });

  it('移行手順のない古い版からは上げられない（版上げの枠の確認）', async () => {
    const driver = createNodeSqlDriver();
    await applySchema(driver);
    await driver.run('UPDATE schema_version SET version = ?', [0]);
    await expect(applySchema(driver)).rejects.toThrow('移行手順がありません');
    await driver.close();
  });
});

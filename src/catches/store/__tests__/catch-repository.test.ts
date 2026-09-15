import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeCatch } from '../../__tests__/fixtures';
import type { Catch } from '../../log/catch';
import type { CatchStorePort } from '../../log/catch-store-port';
import type { Logger } from '../../log/logger';
import { createCatchRepository } from '../catch-repository';
import { createBrokenSqlDriver, createNodeSqlDriver, type NodeSqlDriver } from './node-sql-driver';
import {
  createFakeResizer,
  createTempPhotoFileSystem,
  writeFakeSourcePhoto,
  type TempPhotoFileSystem,
} from './temp-photo-files';

function createRecordingLogger(): Logger & { warnings: string[] } {
  const warnings: string[] = [];
  return {
    warnings,
    warn: (message) => {
      warnings.push(message);
    },
    error: () => undefined,
  };
}

type Harness = {
  driver: NodeSqlDriver;
  files: TempPhotoFileSystem;
  logger: ReturnType<typeof createRecordingLogger>;
  repository: CatchStorePort;
};

async function setUp(databaseFile = ':memory:'): Promise<Harness> {
  const driver = createNodeSqlDriver(databaseFile);
  const files = await createTempPhotoFileSystem();
  const logger = createRecordingLogger();
  const repository = createCatchRepository({
    driver,
    files,
    resizer: createFakeResizer(),
    logger,
  });
  const init = await repository.initialize();
  expect(init.ok).toBe(true);
  return { driver, files, logger, repository };
}

async function tearDown(harness: Harness): Promise<void> {
  await harness.driver.close();
  await harness.files.cleanup();
}

async function insertAll(repository: CatchStorePort, rows: readonly Catch[]): Promise<void> {
  for (const row of rows) {
    const result = await repository.insertCatch(row);
    expect(result.ok).toBe(true);
  }
}

describe('CatchRepository: 保存と読み出し', () => {
  it('保存した釣果をそのまま読める（日時・数値・null の往復）', async () => {
    const harness = await setUp();
    const original = makeCatch({
      id: 'c1',
      species: 'テストアジ',
      sizeCm: 25.5,
      weightG: null,
      placeName: null,
      caughtAt: new Date('2026-09-11T05:05:00.000Z'),
    });
    await insertAll(harness.repository, [original]);
    const listed = await harness.repository.listCatches({});
    expect(listed.ok && listed.value).toEqual([original]);
    await tearDown(harness);
  });

  it('同じ id を二重に保存すると失敗を返す（握りつぶさない）', async () => {
    const harness = await setUp();
    await insertAll(harness.repository, [makeCatch({ id: 'dup' })]);
    const second = await harness.repository.insertCatch(makeCatch({ id: 'dup' }));
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.error.cause).toBeInstanceOf(Error);
    }
    await tearDown(harness);
  });

  it('一覧は新しい順、同じ時刻は id 順で安定する（BR2.1）', async () => {
    const harness = await setUp();
    const sameTime = new Date('2026-09-10T00:00:00.000Z');
    await insertAll(harness.repository, [
      makeCatch({ id: 'b-same', caughtAt: sameTime }),
      makeCatch({ id: 'old', caughtAt: new Date('2026-09-01T00:00:00.000Z') }),
      makeCatch({ id: 'a-same', caughtAt: sameTime }),
      makeCatch({ id: 'newest', caughtAt: new Date('2026-09-11T00:00:00.000Z') }),
    ]);
    const listed = await harness.repository.listCatches({});
    expect(listed.ok && listed.value.map((row) => row.id)).toEqual([
      'newest',
      'a-same',
      'b-same',
      'old',
    ]);
    await tearDown(harness);
  });

  it('魚種と場所の絞り込みは完全一致の AND（BR2.2）', async () => {
    const harness = await setUp();
    await insertAll(harness.repository, [
      makeCatch({ id: 'c1', species: 'テストアジ', placeName: 'テスト堤防' }),
      makeCatch({ id: 'c2', species: 'テストアジ', placeName: 'テスト磯' }),
      makeCatch({ id: 'c3', species: 'テストサバ', placeName: 'テスト堤防' }),
      makeCatch({ id: 'c4', species: 'テストアジ2', placeName: 'テスト堤防' }),
    ]);
    const bySpecies = await harness.repository.listCatches({ species: 'テストアジ' });
    expect(bySpecies.ok && bySpecies.value.map((row) => row.id).sort()).toEqual(['c1', 'c2']);
    const byPlace = await harness.repository.listCatches({ placeName: 'テスト堤防' });
    expect(byPlace.ok && byPlace.value.map((row) => row.id).sort()).toEqual(['c1', 'c3', 'c4']);
    const both = await harness.repository.listCatches({
      species: 'テストアジ',
      placeName: 'テスト堤防',
    });
    expect(both.ok && both.value.map((row) => row.id)).toEqual(['c1']);
    await tearDown(harness);
  });

  it('重複なしの値は未入力を除き、出現の新しい順（BR2.3）', async () => {
    const harness = await setUp();
    await insertAll(harness.repository, [
      makeCatch({ id: 'c1', caughtAt: new Date('2026-09-01T00:00:00Z'), species: 'テストアジ' }),
      makeCatch({ id: 'c2', caughtAt: new Date('2026-09-02T00:00:00Z'), species: null }),
      makeCatch({ id: 'c3', caughtAt: new Date('2026-09-03T00:00:00Z'), species: 'テストサバ' }),
      makeCatch({ id: 'c4', caughtAt: new Date('2026-09-04T00:00:00Z'), species: 'テストアジ' }),
    ]);
    const species = await harness.repository.listDistinctValues('species');
    expect(species.ok && species.value).toEqual(['テストアジ', 'テストサバ']);
    const places = await harness.repository.listDistinctValues('placeName');
    expect(places.ok && places.value).toEqual(['テスト釣り場']);
    await tearDown(harness);
  });

  it('id で1件取得でき、見つからなければ null', async () => {
    const harness = await setUp();
    const row = makeCatch({ id: 'find-me' });
    await insertAll(harness.repository, [row]);
    const found = await harness.repository.findCatch('find-me');
    expect(found.ok && found.value).toEqual(row);
    const missing = await harness.repository.findCatch('nope');
    expect(missing).toEqual({ ok: true, value: null });
    await tearDown(harness);
  });
});

describe('CatchRepository: 写真と削除', () => {
  it('写真の取り込みは原本と縮小版を作る', async () => {
    const harness = await setUp();
    const source = await writeFakeSourcePhoto(harness.files, 'src.jpg');
    const imported = await harness.repository.importPhoto(source, 'c1');
    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(await harness.files.exists(imported.value.photoPath)).toBe(true);
      expect(await harness.files.exists(imported.value.thumbnailPath)).toBe(true);
      await harness.repository.removePhotoFiles(imported.value);
      expect(await harness.files.exists(imported.value.photoPath)).toBe(false);
    }
    await tearDown(harness);
  });

  it('削除で行と写真の2ファイルが消える（BR3.2）', async () => {
    const harness = await setUp();
    const source = await writeFakeSourcePhoto(harness.files);
    const imported = await harness.repository.importPhoto(source, 'c1');
    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      return;
    }
    await insertAll(harness.repository, [makeCatch({ id: 'c1', ...imported.value })]);

    const deleted = await harness.repository.deleteCatch('c1');
    expect(deleted).toEqual({ ok: true, value: undefined });
    expect(await harness.repository.findCatch('c1')).toEqual({ ok: true, value: null });
    expect(await harness.files.exists(imported.value.photoPath)).toBe(false);
    expect(await harness.files.exists(imported.value.thumbnailPath)).toBe(false);
    await tearDown(harness);
  });

  it('ファイルの削除に失敗しても行は消え、成功として返し、警告を記録する（BR3.2）', async () => {
    const harness = await setUp();
    await insertAll(harness.repository, [makeCatch({ id: 'c1' })]);
    harness.files.failNextDelete('ファイルが消せない');
    const deleted = await harness.repository.deleteCatch('c1');
    expect(deleted.ok).toBe(true);
    expect(await harness.repository.findCatch('c1')).toEqual({ ok: true, value: null });
    expect(harness.logger.warnings).toHaveLength(1);
    await tearDown(harness);
  });

  it('存在しない id の削除は成功として扱う', async () => {
    const harness = await setUp();
    const deleted = await harness.repository.deleteCatch('ghost');
    expect(deleted).toEqual({ ok: true, value: undefined });
    await tearDown(harness);
  });
});

describe('CatchRepository: 永続化', () => {
  it('同じデータベースファイルを開き直しても釣果が残る（FR4.1、アプリ再起動相当）', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'catches-db-'));
    const databaseFile = join(directory, 'catches.db');

    const first = await setUp(databaseFile);
    await insertAll(first.repository, [makeCatch({ id: 'persist-1' })]);
    await tearDown(first);

    const second = await setUp(databaseFile);
    const listed = await second.repository.listCatches({});
    expect(listed.ok && listed.value.map((row) => row.id)).toEqual(['persist-1']);
    await tearDown(second);

    await rm(directory, { recursive: true, force: true });
  });
});

describe('CatchRepository: データベース障害', () => {
  it('すべての読み書きが理由付きの失敗を返す（握りつぶさない）', async () => {
    const files = await createTempPhotoFileSystem();
    const repository = createCatchRepository({
      driver: createBrokenSqlDriver(),
      files,
      resizer: createFakeResizer(),
      logger: createRecordingLogger(),
    });
    expect((await repository.insertCatch(makeCatch())).ok).toBe(false);
    expect((await repository.listCatches({})).ok).toBe(false);
    expect((await repository.listDistinctValues('placeName')).ok).toBe(false);
    expect((await repository.findCatch('x')).ok).toBe(false);
    const deleted = await repository.deleteCatch('x');
    expect(deleted.ok).toBe(false);
    if (!deleted.ok) {
      expect(deleted.error.reason).toContain('削除');
    }
    await files.cleanup();
  });

  it('logger を省略すると console に記録する', async () => {
    const files = await createTempPhotoFileSystem();
    const repository = createCatchRepository({
      driver: createNodeSqlDriver(),
      files,
      resizer: createFakeResizer(),
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    files.failNextDelete('消せない');
    await repository.removePhotoFiles({ photoPath: 'p', thumbnailPath: 't' });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
    await files.cleanup();
  });
});

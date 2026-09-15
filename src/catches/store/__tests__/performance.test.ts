// NFR1（一覧は1秒以内、釣果が500件でも軽快）の実測。Build and Test の性能確認で使う。
import { makeCatch } from '../../__tests__/fixtures';
import type { Catch } from '../../log/catch';
import type { CatchStorePort } from '../../log/catch-store-port';
import type { Logger } from '../../log/logger';
import { startStopwatch } from '../../__tests__/stopwatch';
import { createCatchRepository } from '../catch-repository';
import { createNodeSqlDriver, type NodeSqlDriver } from './node-sql-driver';
import {
  createFakeResizer,
  createTempPhotoFileSystem,
  type TempPhotoFileSystem,
} from './temp-photo-files';

/** NFR1 の上限（ミリ秒）。requirements.md の「1秒以内」。 */
const LIST_BUDGET_MS = 1000;
/** NFR1 の件数。requirements.md の「500件」。 */
const ROW_COUNT = 500;

const SPECIES = ['アジ', 'メバル', 'カサゴ', 'シーバス', 'サバ'] as const;
const PLACES = ['テスト堤防', 'テスト海釣り施設', 'テスト港', 'テスト磯'] as const;

const silentLogger: Logger = { warn: () => undefined, error: () => undefined };

function makeRows(count: number): Catch[] {
  const base = Date.UTC(2026, 0, 1, 6, 0, 0);
  return Array.from({ length: count }, (_, index) =>
    makeCatch({
      id: `perf-${String(index).padStart(4, '0')}`,
      species: SPECIES[index % SPECIES.length],
      placeName: PLACES[index % PLACES.length],
      sizeCm: 20 + (index % 30),
      weightG: 100 + index,
      caughtAt: new Date(base + index * 60_000),
    }),
  );
}

describe('NFR1 一覧の応答時間（500件）', () => {
  let driver: NodeSqlDriver;
  let files: TempPhotoFileSystem;
  let repository: CatchStorePort;

  beforeAll(async () => {
    driver = createNodeSqlDriver(':memory:');
    files = await createTempPhotoFileSystem();
    repository = createCatchRepository({
      driver,
      files,
      resizer: createFakeResizer(),
      logger: silentLogger,
    });
    const init = await repository.initialize();
    expect(init.ok).toBe(true);
    for (const row of makeRows(ROW_COUNT)) {
      const inserted = await repository.insertCatch(row);
      expect(inserted.ok).toBe(true);
    }
  });

  afterAll(async () => {
    await driver.close();
    await files.cleanup();
  });

  it(`絞り込みなしの一覧が ${ROW_COUNT} 件でも ${LIST_BUDGET_MS}ms 以内に返る`, async () => {
    const elapsed = startStopwatch();
    const result = await repository.listCatches({});
    const elapsedMs = elapsed();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(ROW_COUNT);
      expect(result.value[0]?.id).toBe(`perf-${String(ROW_COUNT - 1).padStart(4, '0')}`);
    }
    // eslint-disable-next-line no-console -- 計測値を Build and Test の証跡として残す
    console.log(`[NFR1] 一覧（絞り込みなし・${ROW_COUNT}件）: ${elapsedMs.toFixed(1)}ms`);
    expect(elapsedMs).toBeLessThan(LIST_BUDGET_MS);
  });

  it(`魚種と場所の絞り込みが ${ROW_COUNT} 件でも ${LIST_BUDGET_MS}ms 以内に返る`, async () => {
    const elapsed = startStopwatch();
    const result = await repository.listCatches({ species: 'アジ', placeName: 'テスト堤防' });
    const elapsedMs = elapsed();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBeGreaterThan(0);
      expect(
        result.value.every((row) => row.species === 'アジ' && row.placeName === 'テスト堤防'),
      ).toBe(true);
    }
    // eslint-disable-next-line no-console -- 計測値を Build and Test の証跡として残す
    console.log(`[NFR1] 絞り込み（魚種＋場所・${ROW_COUNT}件中）: ${elapsedMs.toFixed(1)}ms`);
    expect(elapsedMs).toBeLessThan(LIST_BUDGET_MS);
  });

  it(`絞り込み候補の取得が ${ROW_COUNT} 件でも ${LIST_BUDGET_MS}ms 以内に返る`, async () => {
    const elapsed = startStopwatch();
    const result = await repository.listDistinctValues('species');
    const elapsedMs = elapsed();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(SPECIES.length);
    }
    // eslint-disable-next-line no-console -- 計測値を Build and Test の証跡として残す
    console.log(`[NFR1] 絞り込み候補（魚種・${ROW_COUNT}件中）: ${elapsedMs.toFixed(1)}ms`);
    expect(elapsedMs).toBeLessThan(LIST_BUDGET_MS);
  });
});

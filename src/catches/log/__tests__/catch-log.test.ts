import { createFakeCatchStore } from '../../__tests__/fake-catch-store';
import { FIXED_NOW, makeCatch, makeCatchInput } from '../../__tests__/fixtures';
import { messages } from '../../messages';
import { createCatchLog, MAX_PLACE_SUGGESTIONS, type Logger } from '../catch-log';

const FIXED_ID = '11111111-2222-4333-8444-555555555555';

function createSilentLogger(): Logger & { warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];
  return {
    warnings,
    errors,
    warn: (message) => {
      warnings.push(message);
    },
    error: (message) => {
      errors.push(message);
    },
  };
}

function setUp(initialRows = [] as ReturnType<typeof makeCatch>[]) {
  const store = createFakeCatchStore(initialRows);
  const logger = createSilentLogger();
  const log = createCatchLog({
    store,
    clock: () => FIXED_NOW,
    idGenerator: () => FIXED_ID,
    logger,
  });
  return { store, logger, log };
}

describe('CatchLog.saveCatch', () => {
  it('保存時に注入した id と時計の時刻が付き、写真の取り込み結果が行に入る（BR1.5、BR1.6、BR4.3）', async () => {
    const { store, log } = setUp();
    const result = await log.saveCatch(
      makeCatchInput({
        species: 'テストアジ',
        sizeCm: '25.5',
        weightG: '120',
        placeName: 'テスト釣り場',
      }),
    );
    expect(result.kind).toBe('saved');
    if (result.kind === 'saved') {
      expect(result.catch).toEqual({
        id: FIXED_ID,
        photoPath: `photos/${FIXED_ID}.jpg`,
        thumbnailPath: `thumbnails/${FIXED_ID}.jpg`,
        species: 'テストアジ',
        sizeCm: 25.5,
        weightG: 120,
        placeName: 'テスト釣り場',
        caughtAt: FIXED_NOW,
      });
    }
    expect(store.rows).toHaveLength(1);
  });

  it('検証に違反すると項目ごとの文言を返し、保存層を呼ばない', async () => {
    const { store, log } = setUp();
    const result = await log.saveCatch(makeCatchInput({ photoUri: null, sizeCm: 'abc' }));
    expect(result.kind).toBe('invalid');
    if (result.kind === 'invalid') {
      expect(result.errors.photo).toBe(messages.errors.photoRequired);
      expect(result.errors.sizeCm).toBe(messages.errors.sizeInvalid);
    }
    expect(store.calls.importPhoto).toBe(0);
    expect(store.calls.insertCatch).toBe(0);
  });

  it('写真の取り込みに失敗すると理由付きで失敗を返し、行を保存しない', async () => {
    const { store, logger, log } = setUp();
    store.failWith('importPhoto', 'コピーに失敗');
    const result = await log.saveCatch(makeCatchInput());
    expect(result).toEqual({ kind: 'failed', reason: messages.errors.saveFailed });
    expect(store.calls.insertCatch).toBe(0);
    expect(logger.errors).toHaveLength(1);
  });

  it('行の保存に失敗すると理由付きで失敗を返し、取り込んだ写真ファイルを消す（BR4.3）', async () => {
    const { store, log } = setUp();
    store.failWith('insertCatch', 'ディスクが書けない');
    const result = await log.saveCatch(makeCatchInput());
    expect(result).toEqual({ kind: 'failed', reason: messages.errors.saveFailed });
    expect(store.removedPhotos).toEqual([
      { photoPath: `photos/${FIXED_ID}.jpg`, thumbnailPath: `thumbnails/${FIXED_ID}.jpg` },
    ]);
    expect(store.rows).toHaveLength(0);
  });
});

describe('CatchLog.listCatches', () => {
  const older = makeCatch({ id: 'c-old', caughtAt: new Date(2026, 8, 1), species: 'テストアジ' });
  const newer = makeCatch({ id: 'c-new', caughtAt: new Date(2026, 8, 10), species: 'テストサバ' });
  const newest = makeCatch({
    id: 'c-newest',
    caughtAt: new Date(2026, 8, 11),
    species: 'テストアジ',
    placeName: 'テスト堤防',
  });

  it('新しい順で返す（BR2.1）', async () => {
    const { log } = setUp([older, newest, newer]);
    const result = await log.listCatches();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((row) => row.id)).toEqual(['c-newest', 'c-new', 'c-old']);
    }
  });

  it('魚種と場所を両方指定すると AND で絞り込む（BR2.2）', async () => {
    const { log } = setUp([older, newest, newer]);
    const bySpecies = await log.listCatches({ species: 'テストアジ' });
    expect(bySpecies.ok && bySpecies.value.map((row) => row.id)).toEqual(['c-newest', 'c-old']);

    const both = await log.listCatches({ species: 'テストアジ', placeName: 'テスト堤防' });
    expect(both.ok && both.value.map((row) => row.id)).toEqual(['c-newest']);

    const none = await log.listCatches({ species: 'テストサバ', placeName: 'テスト堤防' });
    expect(none.ok && none.value).toEqual([]);
  });

  it('読み込みに失敗すると文言を返す（BR4.6）', async () => {
    const { store, log } = setUp([older]);
    store.failWith('listCatches', 'DB が壊れている');
    const result = await log.listCatches();
    expect(result).toEqual({ ok: false, reason: messages.list.loadFailed });
  });
});

describe('CatchLog.getFilterOptions / suggestPlaces', () => {
  const rows = [
    makeCatch({
      id: 'c1',
      caughtAt: new Date(2026, 8, 1),
      species: 'テストアジ',
      placeName: 'テスト釣り場A',
    }),
    makeCatch({ id: 'c2', caughtAt: new Date(2026, 8, 2), species: null, placeName: null }),
    makeCatch({
      id: 'c3',
      caughtAt: new Date(2026, 8, 3),
      species: 'テストサバ',
      placeName: 'テスト釣り場B',
    }),
    makeCatch({
      id: 'c4',
      caughtAt: new Date(2026, 8, 4),
      species: 'テストアジ',
      placeName: 'テスト釣り場A',
    }),
    makeCatch({
      id: 'c5',
      caughtAt: new Date(2026, 8, 5),
      species: 'テストイワシ',
      placeName: '別の場所C',
    }),
    makeCatch({
      id: 'c6',
      caughtAt: new Date(2026, 8, 6),
      species: 'テストタイ',
      placeName: 'テスト釣り場D',
    }),
    makeCatch({
      id: 'c7',
      caughtAt: new Date(2026, 8, 7),
      species: 'テストヒラメ',
      placeName: 'テスト釣り場E',
    }),
    makeCatch({
      id: 'c8',
      caughtAt: new Date(2026, 8, 8),
      species: 'テストカサゴ',
      placeName: 'テスト釣り場F',
    }),
  ];

  it('候補は重複なし・未入力を除き・新しい順（BR2.3）', async () => {
    const { log } = setUp(rows);
    const result = await log.getFilterOptions();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.species).toEqual([
        'テストカサゴ',
        'テストヒラメ',
        'テストタイ',
        'テストイワシ',
        'テストアジ',
        'テストサバ',
      ]);
      // 場所A は c4（9/4）が最新の出現なので、c3（9/3）の場所B より前に来る
      expect(result.value.places).toEqual([
        'テスト釣り場F',
        'テスト釣り場E',
        'テスト釣り場D',
        '別の場所C',
        'テスト釣り場A',
        'テスト釣り場B',
      ]);
    }
  });

  it('保存層が重複や空文字を返しても候補では除く（BR2.3 の二重の守り）', async () => {
    const { store } = setUp(rows);
    const rawStore = {
      ...store,
      listDistinctValues: async () => ({
        ok: true as const,
        value: ['テストアジ', '', 'テストアジ', 'テストサバ'],
      }),
    };
    const rawLog = createCatchLog({
      store: rawStore,
      clock: () => FIXED_NOW,
      idGenerator: () => FIXED_ID,
      logger: createSilentLogger(),
    });
    const result = await rawLog.getFilterOptions();
    expect(result.ok && result.value.species).toEqual(['テストアジ', 'テストサバ']);
  });

  it('場所の候補だけ読み込みに失敗しても文言を返す', async () => {
    const { store, logger } = setUp(rows);
    const placeFailingStore = {
      ...store,
      listDistinctValues: async (field: 'species' | 'placeName') =>
        field === 'placeName'
          ? { ok: false as const, error: { reason: '場所が読めない' } }
          : store.listDistinctValues(field),
    };
    const log = createCatchLog({
      store: placeFailingStore,
      clock: () => FIXED_NOW,
      idGenerator: () => FIXED_ID,
      logger,
    });
    const result = await log.getFilterOptions();
    expect(result).toEqual({ ok: false, reason: messages.list.loadFailed });
    expect(logger.errors).toEqual(['場所の候補の読み込みに失敗しました']);
  });

  it('候補の読み込みに失敗すると文言を返す', async () => {
    const { store, log } = setUp(rows);
    store.failWith('listDistinctValues', '読めない');
    const result = await log.getFilterOptions();
    expect(result).toEqual({ ok: false, reason: messages.list.loadFailed });
  });

  it('場所の候補は入力文字を含むものを最大 5 件、新しい順で返す（BR6.1）', async () => {
    const { log } = setUp(rows);
    const all = await log.suggestPlaces('');
    expect(all).toHaveLength(MAX_PLACE_SUGGESTIONS);
    expect(all[0]).toBe('テスト釣り場F');

    const partial = await log.suggestPlaces('釣り場');
    expect(partial).toEqual([
      'テスト釣り場F',
      'テスト釣り場E',
      'テスト釣り場D',
      'テスト釣り場A',
      'テスト釣り場B',
    ]);

    const specific = await log.suggestPlaces('別の');
    expect(specific).toEqual(['別の場所C']);
  });

  it('場所の候補の読み込みに失敗すると記録して空を返す（画面を止めない）', async () => {
    const { store, logger, log } = setUp(rows);
    store.failWith('listDistinctValues', '読めない');
    const result = await log.suggestPlaces('テ');
    expect(result).toEqual([]);
    expect(logger.warnings).toHaveLength(1);
  });
});

describe('CatchLog.getCatch / deleteCatch / prepareStorage', () => {
  it('id で1件取得し、見つからなければ null を返す', async () => {
    const { log } = setUp([makeCatch({ id: 'c1' })]);
    const found = await log.getCatch('c1');
    expect(found.ok && found.value?.id).toBe('c1');
    const missing = await log.getCatch('nope');
    expect(missing).toEqual({ ok: true, value: null });
  });

  it('1件の読み込みに失敗すると「表示できませんでした」を返す', async () => {
    const { store, log } = setUp([makeCatch({ id: 'c1' })]);
    store.failWith('findCatch', '読めない');
    const result = await log.getCatch('c1');
    expect(result).toEqual({ ok: false, reason: messages.detail.loadFailed });
  });

  it('削除は保存層に委譲し、成功を返す（BR3.2）', async () => {
    const { store, log } = setUp([makeCatch({ id: 'c1' })]);
    const result = await log.deleteCatch('c1');
    expect(result).toEqual({ ok: true, value: undefined });
    expect(store.deletedIds).toEqual(['c1']);
    expect(store.rows).toHaveLength(0);
  });

  it('削除に失敗すると「削除できませんでした」を返す', async () => {
    const { store, log } = setUp([makeCatch({ id: 'c1' })]);
    store.failWith('deleteCatch', '行が消せない');
    const result = await log.deleteCatch('c1');
    expect(result).toEqual({ ok: false, reason: messages.detail.deleteFailed });
    expect(store.rows).toHaveLength(1);
  });

  it('保存領域の初期化に失敗すると致命的エラーの文言を返す（BR4.5）', async () => {
    const { store, logger, log } = setUp();
    store.failWith('initialize', 'ディレクトリが作れない');
    const result = await log.prepareStorage();
    expect(result).toEqual({ ok: false, reason: messages.app.storageInitFailed });
    expect(logger.errors).toHaveLength(1);
  });

  it('保存領域の初期化に成功すると ok を返す', async () => {
    const { log } = setUp();
    const result = await log.prepareStorage();
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it('logger を注入しなければ console を使う（既定値の確認）', async () => {
    const store = createFakeCatchStore();
    store.failWith('initialize', '失敗');
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const log = createCatchLog({ store, clock: () => FIXED_NOW, idGenerator: () => FIXED_ID });
    await log.prepareStorage();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });
});

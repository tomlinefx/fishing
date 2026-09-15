// CatchLog: 釣果のルール・検証・並び順・絞り込みを担うサービス。
// 時計と ID 生成器は注入で受け取る（テストで固定するため）。
import { messages } from '../messages';
import type { Catch, CatchFilter, CatchInput, FilterOptions } from './catch';
import type { CatchStorePort } from './catch-store-port';
import { consoleLogger, type Logger } from './logger';
import { validateCatchInput, type FieldErrors } from './validation';

export type Clock = () => Date;
export type IdGenerator = () => string;
export type { Logger } from './logger';

/** 場所の候補の最大件数（BR6.1） */
export const MAX_PLACE_SUGGESTIONS = 5;

export type SaveCatchResult =
  | { readonly kind: 'saved'; readonly catch: Catch }
  | { readonly kind: 'invalid'; readonly errors: FieldErrors }
  | { readonly kind: 'failed'; readonly reason: string };

export type LogResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reason: string };

export interface CatchLog {
  /** 保存領域を準備する。失敗は致命的（BR4.5）。 */
  prepareStorage(): Promise<LogResult<void>>;
  /** 検証 → id と日時の付与 → 写真の取り込み → 保存（WF-1 手順5〜6） */
  saveCatch(input: CatchInput): Promise<SaveCatchResult>;
  /** 一覧を新しい順で取得する。絞り込みは AND（BR2.1、BR2.2）。 */
  listCatches(filter?: CatchFilter): Promise<LogResult<readonly Catch[]>>;
  /** 絞り込みチップの候補（重複なし、未入力を除く、BR2.3） */
  getFilterOptions(): Promise<LogResult<FilterOptions>>;
  /** 場所の候補（入力文字を含む過去の場所名、最大 5 件、BR6.1）。失敗時は記録して空を返す。 */
  suggestPlaces(query: string): Promise<readonly string[]>;
  /** id で1件取得する。見つからなければ null */
  getCatch(id: string): Promise<LogResult<Catch | null>>;
  /** 削除する（行と写真をまとめて消すのは保存層に委譲、BR3.2） */
  deleteCatch(id: string): Promise<LogResult<void>>;
}

export type CatchLogDependencies = {
  readonly store: CatchStorePort;
  readonly clock: Clock;
  readonly idGenerator: IdGenerator;
  readonly logger?: Logger;
};

/** 重複を除き、空文字と null を落とす（順序は保つ） */
function uniqueNonEmpty(values: readonly (string | null)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (value === null || value.length === 0 || seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }
  return result;
}

export function createCatchLog(deps: CatchLogDependencies): CatchLog {
  const { store, clock, idGenerator } = deps;
  const logger: Logger = deps.logger ?? consoleLogger;

  async function prepareStorage(): Promise<LogResult<void>> {
    const result = await store.initialize();
    if (!result.ok) {
      logger.error('保存領域の初期化に失敗しました', result.error.cause ?? result.error.reason);
      return { ok: false, reason: messages.app.storageInitFailed };
    }
    return { ok: true, value: undefined };
  }

  async function saveCatch(input: CatchInput): Promise<SaveCatchResult> {
    const validation = validateCatchInput(input);
    if (!validation.ok) {
      return { kind: 'invalid', errors: validation.errors };
    }

    const id = idGenerator(); // BR1.6
    const caughtAt = clock(); // BR1.5

    const imported = await store.importPhoto(validation.value.photoUri, id); // BR4.3
    if (!imported.ok) {
      logger.error('写真の取り込みに失敗しました', imported.error.cause ?? imported.error.reason);
      return { kind: 'failed', reason: messages.errors.saveFailed };
    }

    const catchRecord: Catch = {
      id,
      photoPath: imported.value.photoPath,
      thumbnailPath: imported.value.thumbnailPath,
      species: validation.value.species,
      sizeCm: validation.value.sizeCm,
      weightG: validation.value.weightG,
      placeName: validation.value.placeName,
      caughtAt,
    };

    const inserted = await store.insertCatch(catchRecord);
    if (!inserted.ok) {
      logger.error('釣果の保存に失敗しました', inserted.error.cause ?? inserted.error.reason);
      // 途中で作った写真ファイルを消す（BR4.3）
      await store.removePhotoFiles(imported.value);
      return { kind: 'failed', reason: messages.errors.saveFailed };
    }

    return { kind: 'saved', catch: catchRecord };
  }

  async function listCatches(filter: CatchFilter = {}): Promise<LogResult<readonly Catch[]>> {
    const result = await store.listCatches(filter);
    if (!result.ok) {
      logger.error('一覧の読み込みに失敗しました', result.error.cause ?? result.error.reason);
      return { ok: false, reason: messages.list.loadFailed };
    }
    return { ok: true, value: result.value };
  }

  async function getFilterOptions(): Promise<LogResult<FilterOptions>> {
    const [species, places] = await Promise.all([
      store.listDistinctValues('species'),
      store.listDistinctValues('placeName'),
    ]);
    if (!species.ok) {
      logger.error(
        '魚種の候補の読み込みに失敗しました',
        species.error.cause ?? species.error.reason,
      );
      return { ok: false, reason: messages.list.loadFailed };
    }
    if (!places.ok) {
      logger.error('場所の候補の読み込みに失敗しました', places.error.cause ?? places.error.reason);
      return { ok: false, reason: messages.list.loadFailed };
    }
    return {
      ok: true,
      value: { species: uniqueNonEmpty(species.value), places: uniqueNonEmpty(places.value) },
    };
  }

  async function suggestPlaces(query: string): Promise<readonly string[]> {
    const result = await store.listDistinctValues('placeName');
    if (!result.ok) {
      logger.warn('場所の候補の読み込みに失敗しました', result.error.cause ?? result.error.reason);
      return [];
    }
    const needle = query.trim();
    return uniqueNonEmpty(result.value)
      .filter((place) => needle.length === 0 || place.includes(needle))
      .slice(0, MAX_PLACE_SUGGESTIONS);
  }

  async function getCatch(id: string): Promise<LogResult<Catch | null>> {
    const result = await store.findCatch(id);
    if (!result.ok) {
      logger.error('釣果の読み込みに失敗しました', result.error.cause ?? result.error.reason);
      return { ok: false, reason: messages.detail.loadFailed };
    }
    return { ok: true, value: result.value };
  }

  async function deleteCatch(id: string): Promise<LogResult<void>> {
    const result = await store.deleteCatch(id);
    if (!result.ok) {
      logger.error('釣果の削除に失敗しました', result.error.cause ?? result.error.reason);
      return { ok: false, reason: messages.detail.deleteFailed };
    }
    return { ok: true, value: undefined };
  }

  return {
    prepareStorage,
    saveCatch,
    listCatches,
    getFilterOptions,
    suggestPlaces,
    getCatch,
    deleteCatch,
  };
}

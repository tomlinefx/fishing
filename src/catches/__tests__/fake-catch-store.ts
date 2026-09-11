// メモリ内のフェイク保存層（ロジック層のテスト用）。失敗を差し込めるようにしてある。
import type { Catch, CatchFilter } from '../log/catch';
import type {
  CatchStorePort,
  DistinctField,
  ImportedPhoto,
  StoreResult,
} from '../log/catch-store-port';

type FailableMethod =
  | 'initialize'
  | 'importPhoto'
  | 'insertCatch'
  | 'listCatches'
  | 'listDistinctValues'
  | 'findCatch'
  | 'deleteCatch';

export type FakeCatchStore = CatchStorePort & {
  /** 保存済みの行（新しい順ではなく挿入順） */
  readonly rows: Catch[];
  /** removePhotoFiles で消されたファイル */
  readonly removedPhotos: ImportedPhoto[];
  /** 削除された行の id */
  readonly deletedIds: string[];
  /** 指定したメソッドを次から失敗させる（reason を返す） */
  failWith(method: FailableMethod, reason: string): void;
  /** 各メソッドの呼び出し回数 */
  readonly calls: Record<FailableMethod | 'removePhotoFiles', number>;
};

function compareNewestFirst(a: Catch, b: Catch): number {
  const byTime = b.caughtAt.getTime() - a.caughtAt.getTime();
  return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
}

export function createFakeCatchStore(initialRows: readonly Catch[] = []): FakeCatchStore {
  const rows: Catch[] = [...initialRows];
  const removedPhotos: ImportedPhoto[] = [];
  const deletedIds: string[] = [];
  const failures = new Map<FailableMethod, string>();
  const calls: FakeCatchStore['calls'] = {
    initialize: 0,
    importPhoto: 0,
    insertCatch: 0,
    listCatches: 0,
    listDistinctValues: 0,
    findCatch: 0,
    deleteCatch: 0,
    removePhotoFiles: 0,
  };

  function takeFailure(method: FailableMethod): StoreResult<never> | null {
    calls[method] += 1;
    const reason = failures.get(method);
    if (reason === undefined) {
      return null;
    }
    failures.delete(method);
    return { ok: false, error: { reason, cause: new Error(reason) } };
  }

  return {
    rows,
    removedPhotos,
    deletedIds,
    calls,
    failWith(method, reason) {
      failures.set(method, reason);
    },
    async initialize() {
      return takeFailure('initialize') ?? { ok: true, value: undefined };
    },
    async importPhoto(_sourceUri, catchId) {
      return (
        takeFailure('importPhoto') ?? {
          ok: true,
          value: { photoPath: `photos/${catchId}.jpg`, thumbnailPath: `thumbnails/${catchId}.jpg` },
        }
      );
    },
    async removePhotoFiles(photo) {
      calls.removePhotoFiles += 1;
      removedPhotos.push(photo);
    },
    async insertCatch(catchRecord) {
      const failure = takeFailure('insertCatch');
      if (failure) {
        return failure;
      }
      rows.push(catchRecord);
      return { ok: true, value: undefined };
    },
    async listCatches(filter: CatchFilter) {
      const failure = takeFailure('listCatches');
      if (failure) {
        return failure;
      }
      const filtered = rows.filter(
        (row) =>
          (filter.species === undefined || row.species === filter.species) &&
          (filter.placeName === undefined || row.placeName === filter.placeName),
      );
      return { ok: true, value: [...filtered].sort(compareNewestFirst) };
    },
    async listDistinctValues(field: DistinctField) {
      const failure = takeFailure('listDistinctValues');
      if (failure) {
        return failure;
      }
      const seen = new Set<string>();
      const values: string[] = [];
      for (const row of [...rows].sort(compareNewestFirst)) {
        const value = row[field];
        if (value !== null && !seen.has(value)) {
          seen.add(value);
          values.push(value);
        }
      }
      return { ok: true, value: values };
    },
    async findCatch(id) {
      const failure = takeFailure('findCatch');
      if (failure) {
        return failure;
      }
      return { ok: true, value: rows.find((row) => row.id === id) ?? null };
    },
    async deleteCatch(id) {
      const failure = takeFailure('deleteCatch');
      if (failure) {
        return failure;
      }
      const index = rows.findIndex((row) => row.id === id);
      if (index >= 0) {
        rows.splice(index, 1);
      }
      deletedIds.push(id);
      return { ok: true, value: undefined };
    },
  };
}

// ロジック層（CatchLog）が保存層（CatchStore）に求めるインタフェース。
// 依存の向きは「画面 → ロジック ← 保存」（team.md Code Style）。保存層はこの型を実装する。
import type { Catch, CatchFilter } from './catch';

/** 保存層の失敗。理由は人が読める日本語、cause は元の例外（ログ用）。 */
export type StoreFailure = {
  readonly reason: string;
  readonly cause?: unknown;
};

export type StoreResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: StoreFailure };

/** 取り込み済みの写真（原本と縮小版は常に対、BR4.3） */
export type ImportedPhoto = {
  readonly photoPath: string;
  readonly thumbnailPath: string;
};

/** 重複なしの値を読む対象の属性 */
export type DistinctField = 'species' | 'placeName';

export interface CatchStorePort {
  /** 保存領域を初期化する（データベースとアプリ専用のファイル領域）。失敗は致命的（BR4.5）。 */
  initialize(): Promise<StoreResult<void>>;
  /** 一時的な写真の参照からアプリ専用領域へコピーし、縮小版を生成する（BR4.3）。失敗時は途中のファイルを消す。 */
  importPhoto(sourceUri: string, catchId: string): Promise<StoreResult<ImportedPhoto>>;
  /** 取り込み済みの写真ファイルを消す（行の保存に失敗したときの後始末に使う）。失敗は記録するだけ。 */
  removePhotoFiles(photo: ImportedPhoto): Promise<void>;
  /** 釣果を1行として保存する */
  insertCatch(catchRecord: Catch): Promise<StoreResult<void>>;
  /** 一覧を新しい順（caughtAt 降順、同時刻は id 順）で読む。絞り込みは完全一致の AND（BR2.1、BR2.2）。 */
  listCatches(filter: CatchFilter): Promise<StoreResult<readonly Catch[]>>;
  /** 属性の重複なしの値を、出現の新しい順で読む。未入力（null）は含めない（BR2.3）。 */
  listDistinctValues(field: DistinctField): Promise<StoreResult<readonly string[]>>;
  /** id で1件読む。見つからなければ null */
  findCatch(id: string): Promise<StoreResult<Catch | null>>;
  /** 行を消してから写真の原本と縮小版を消す（BR3.2）。行の削除失敗だけを失敗として返す。 */
  deleteCatch(id: string): Promise<StoreResult<void>>;
}

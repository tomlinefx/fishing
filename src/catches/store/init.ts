// 保存領域の初期化（BR4.5）: ディレクトリ作成とスキーマ適用。失敗は致命的エラーとして返す。
import type { StoreResult } from '../log/catch-store-port';
import type { PhotoFileSystem } from './photo-files';
import { applySchema } from './schema';
import type { SqlDriver } from './sql-driver';

export async function initializeStorage(
  driver: SqlDriver,
  files: PhotoFileSystem,
): Promise<StoreResult<void>> {
  try {
    await files.ensureDirectories();
    await applySchema(driver);
    return { ok: true, value: undefined };
  } catch (cause) {
    return { ok: false, error: { reason: '保存領域の初期化に失敗しました', cause } };
  }
}

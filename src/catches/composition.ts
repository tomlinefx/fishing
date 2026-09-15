// 組み立ての根（composition root）: 本番の部品を注入して CatchLog を作る。
// 保存層を直接参照してよいのはこのファイルだけ（画面は CatchLog だけを使う、ADR-002）。
import { randomUUID } from 'expo-crypto';
import { createCatchLog, type CatchLog } from './log/catch-log';
import { createCatchRepository } from './store/catch-repository';
import { createExpoImageResizer, createExpoPhotoFileSystem } from './store/expo-photo-files';
import { openExpoSqliteDriver } from './store/expo-sqlite-driver';

export async function createProductionCatchLog(): Promise<CatchLog> {
  const driver = await openExpoSqliteDriver();
  const store = createCatchRepository({
    driver,
    files: createExpoPhotoFileSystem(),
    resizer: createExpoImageResizer(),
  });
  return createCatchLog({
    store,
    clock: () => new Date(),
    idGenerator: () => randomUUID(),
  });
}

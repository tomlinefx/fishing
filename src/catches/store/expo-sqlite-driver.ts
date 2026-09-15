// expo-sqlite による SqlDriver の本番実装。
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { SqlDriver, SqlValue } from './sql-driver';

/** 端末内のデータベースファイル名 */
export const DATABASE_NAME = 'catches.db';

export function createExpoSqliteDriver(db: SQLiteDatabase): SqlDriver {
  return {
    async exec(sql) {
      await db.execAsync(sql);
    },
    async run(sql, params: readonly SqlValue[] = []) {
      const result = await db.runAsync(sql, [...params]);
      return { changes: result.changes };
    },
    async all<T extends object>(sql: string, params: readonly SqlValue[] = []) {
      return db.getAllAsync<T>(sql, [...params]);
    },
    async get<T extends object>(sql: string, params: readonly SqlValue[] = []) {
      const row = await db.getFirstAsync<T>(sql, [...params]);
      return row ?? null;
    },
    async close() {
      await db.closeAsync();
    },
  };
}

/** データベースを開いてドライバを返す。失敗は呼び出し元（初期化）で致命的エラーとして扱う。 */
export async function openExpoSqliteDriver(
  databaseName: string = DATABASE_NAME,
): Promise<SqlDriver> {
  const db = await openDatabaseAsync(databaseName);
  return createExpoSqliteDriver(db);
}

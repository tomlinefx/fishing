// テスト用の SqlDriver 実装（better-sqlite3、Node 上で動く）。本番の expo-sqlite と同じインタフェース。
import Database from 'better-sqlite3';
import type { SqlDriver, SqlValue } from '../sql-driver';

export type NodeSqlDriver = SqlDriver & { readonly database: Database.Database };

/** ファイル名を省略するとメモリ内 DB。永続化のテストでは一時ファイルを渡す。 */
export function createNodeSqlDriver(filename: string = ':memory:'): NodeSqlDriver {
  const database = new Database(filename);
  return {
    database,
    async exec(sql) {
      database.exec(sql);
    },
    async run(sql, params: readonly SqlValue[] = []) {
      const info = database.prepare(sql).run(...params);
      return { changes: info.changes };
    },
    async all<T extends object>(sql: string, params: readonly SqlValue[] = []) {
      return database.prepare(sql).all(...params) as T[];
    },
    async get<T extends object>(sql: string, params: readonly SqlValue[] = []) {
      const row = database.prepare(sql).get(...params) as T | undefined;
      return row ?? null;
    },
    async close() {
      database.close();
    },
  };
}

/** すべての操作が例外を投げるドライバ（保存層の失敗経路のテスト用） */
export function createBrokenSqlDriver(message = 'データベースが壊れています'): SqlDriver {
  const fail = async (): Promise<never> => {
    throw new Error(message);
  };
  return { exec: fail, run: fail, all: fail, get: fail, close: fail };
}

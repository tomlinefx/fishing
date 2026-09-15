// SQL 実行の薄いインタフェース。本番は expo-sqlite、テストは better-sqlite3 で実装する。
export type SqlValue = string | number | null;

export type SqlRunResult = {
  /** 変更された行数 */
  readonly changes: number;
};

export interface SqlDriver {
  /** 複数文を一度に実行する（スキーマ適用用） */
  exec(sql: string): Promise<void>;
  /** INSERT / UPDATE / DELETE を実行する */
  run(sql: string, params?: readonly SqlValue[]): Promise<SqlRunResult>;
  /** 複数行を読む */
  all<T extends object>(sql: string, params?: readonly SqlValue[]): Promise<T[]>;
  /** 先頭の1行を読む。なければ null */
  get<T extends object>(sql: string, params?: readonly SqlValue[]): Promise<T | null>;
  /** 接続を閉じる */
  close(): Promise<void>;
}

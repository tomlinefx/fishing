// テーブル定義と版上げの枠。属性は functional-design/entities.md のとおり。
import type { SqlDriver } from './sql-driver';

/** 現在のスキーマの版。テーブルを変えるときは +1 して MIGRATIONS に手順を足す。 */
export const SCHEMA_VERSION = 1;

export const CREATE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS catches (
  id TEXT PRIMARY KEY NOT NULL,
  photo_path TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,
  species TEXT,
  size_cm REAL,
  weight_g INTEGER,
  place_name TEXT,
  caught_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_catches_caught_at ON catches (caught_at DESC, id);
`;

/** 版 n から n+1 へ上げる手順。添字が「上げる前の版」。 */
type Migration = (driver: SqlDriver) => Promise<void>;
const MIGRATIONS: ReadonlyMap<number, Migration> = new Map();

type VersionRow = { version: number };

/** スキーマを適用する。既存のデータがあればそのまま使い、版が古ければ順に上げる（FR4.1）。 */
export async function applySchema(driver: SqlDriver): Promise<void> {
  await driver.exec(CREATE_SCHEMA_SQL);
  const row = await driver.get<VersionRow>('SELECT version FROM schema_version LIMIT 1');
  if (row === null) {
    await driver.run('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
    return;
  }
  if (row.version > SCHEMA_VERSION) {
    throw new Error(
      `データベースの版（${row.version}）がアプリの版（${SCHEMA_VERSION}）より新しいため開けません`,
    );
  }
  for (let version = row.version; version < SCHEMA_VERSION; version += 1) {
    const migrate = MIGRATIONS.get(version);
    if (migrate === undefined) {
      throw new Error(`版 ${version} から ${version + 1} への移行手順がありません`);
    }
    await migrate(driver);
    await driver.run('UPDATE schema_version SET version = ?', [version + 1]);
  }
}

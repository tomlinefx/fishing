// CatchStorePort の実装。釣果1件＝ catches テーブルの1行。写真はファイルとして別に持つ。
import type { Catch, CatchFilter } from '../log/catch';
import type {
  CatchStorePort,
  DistinctField,
  ImportedPhoto,
  StoreResult,
} from '../log/catch-store-port';
import { consoleLogger, type Logger } from '../log/logger';
import { initializeStorage } from './init';
import {
  importPhoto,
  removePhotoFiles,
  type ImageResizer,
  type PhotoFileSystem,
} from './photo-files';
import type { SqlDriver, SqlValue } from './sql-driver';

export type CatchRepositoryDependencies = {
  readonly driver: SqlDriver;
  readonly files: PhotoFileSystem;
  readonly resizer: ImageResizer;
  readonly logger?: Logger;
};

type CatchRow = {
  id: string;
  photo_path: string;
  thumbnail_path: string;
  species: string | null;
  size_cm: number | null;
  weight_g: number | null;
  place_name: string | null;
  caught_at: string;
};

const SELECT_COLUMNS =
  'id, photo_path, thumbnail_path, species, size_cm, weight_g, place_name, caught_at';

const COLUMN_BY_FIELD: Record<DistinctField, string> = {
  species: 'species',
  placeName: 'place_name',
};

function toCatch(row: CatchRow): Catch {
  return {
    id: row.id,
    photoPath: row.photo_path,
    thumbnailPath: row.thumbnail_path,
    species: row.species,
    sizeCm: row.size_cm,
    weightG: row.weight_g,
    placeName: row.place_name,
    caughtAt: new Date(row.caught_at),
  };
}

function failure<T>(reason: string, cause: unknown): StoreResult<T> {
  return { ok: false, error: { reason, cause } };
}

export function createCatchRepository(deps: CatchRepositoryDependencies): CatchStorePort {
  const { driver, files, resizer } = deps;
  const logger = deps.logger ?? consoleLogger;
  const photoDeps = { files, resizer, logger };

  return {
    initialize() {
      return initializeStorage(driver, files);
    },

    importPhoto(sourceUri, catchId) {
      return importPhoto(photoDeps, sourceUri, catchId);
    },

    removePhotoFiles(photo: ImportedPhoto) {
      return removePhotoFiles(photoDeps, photo);
    },

    async insertCatch(catchRecord) {
      try {
        await driver.run(
          `INSERT INTO catches (${SELECT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            catchRecord.id,
            catchRecord.photoPath,
            catchRecord.thumbnailPath,
            catchRecord.species,
            catchRecord.sizeCm,
            catchRecord.weightG,
            catchRecord.placeName,
            catchRecord.caughtAt.toISOString(),
          ],
        );
        return { ok: true, value: undefined };
      } catch (cause) {
        return failure('釣果の行を保存できませんでした', cause);
      }
    },

    async listCatches(filter: CatchFilter) {
      const conditions: string[] = [];
      const params: SqlValue[] = [];
      if (filter.species !== undefined) {
        conditions.push('species = ?');
        params.push(filter.species);
      }
      if (filter.placeName !== undefined) {
        conditions.push('place_name = ?');
        params.push(filter.placeName);
      }
      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      try {
        const rows = await driver.all<CatchRow>(
          `SELECT ${SELECT_COLUMNS} FROM catches ${where} ORDER BY caught_at DESC, id ASC`,
          params,
        );
        return { ok: true, value: rows.map(toCatch) };
      } catch (cause) {
        return failure('一覧を読み込めませんでした', cause);
      }
    },

    async listDistinctValues(field) {
      const column = COLUMN_BY_FIELD[field];
      try {
        const rows = await driver.all<{ value: string }>(
          `SELECT ${column} AS value FROM catches WHERE ${column} IS NOT NULL AND ${column} <> '' ` +
            `GROUP BY ${column} ORDER BY MAX(caught_at) DESC, ${column} ASC`,
        );
        return { ok: true, value: rows.map((row) => row.value) };
      } catch (cause) {
        return failure('候補を読み込めませんでした', cause);
      }
    },

    async findCatch(id) {
      try {
        const row = await driver.get<CatchRow>(
          `SELECT ${SELECT_COLUMNS} FROM catches WHERE id = ?`,
          [id],
        );
        return { ok: true, value: row === null ? null : toCatch(row) };
      } catch (cause) {
        return failure('釣果を読み込めませんでした', cause);
      }
    },

    async deleteCatch(id) {
      let row: CatchRow | null;
      try {
        row = await driver.get<CatchRow>(`SELECT ${SELECT_COLUMNS} FROM catches WHERE id = ?`, [
          id,
        ]);
        if (row === null) {
          // すでに無い行は削除済みとして扱う（一覧には出ない）
          return { ok: true, value: undefined };
        }
        await driver.run('DELETE FROM catches WHERE id = ?', [id]);
      } catch (cause) {
        return failure('釣果の行を削除できませんでした', cause);
      }
      // 行の削除が成功してから写真を消す（BR3.2）。ファイル削除の失敗は記録のみ。
      await removePhotoFiles(photoDeps, {
        photoPath: row.photo_path,
        thumbnailPath: row.thumbnail_path,
      });
      return { ok: true, value: undefined };
    },
  };
}

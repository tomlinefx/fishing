// 写真の取り込み（BR4.3）: 原本をアプリ専用領域へコピーし、縮小版を生成する。
// ファイル操作と縮小はインタフェース越しにし、テストでは一時ディレクトリの実装に差し替える。
import type { ImportedPhoto, StoreResult } from '../log/catch-store-port';
import type { Logger } from '../log/logger';

/** 縮小版の長辺（entities.md の初期値） */
export const THUMBNAIL_LONG_EDGE_PX = 480;
/** 縮小版の JPEG 品質（entities.md の初期値） */
export const THUMBNAIL_JPEG_QUALITY = 0.7;

export interface PhotoFileSystem {
  /** 写真用のディレクトリを作る（存在すれば何もしない） */
  ensureDirectories(): Promise<void>;
  /** 釣果 id に対する原本の保存先パス */
  photoPathFor(catchId: string, extension: string): string;
  /** 釣果 id に対する縮小版の保存先パス */
  thumbnailPathFor(catchId: string): string;
  /** 一時的な参照からファイルをコピーする（上書き可） */
  copyFile(sourceUri: string, destinationPath: string): Promise<void>;
  /** ファイルを消す。存在しなければ何もしない */
  deleteFile(path: string): Promise<void>;
}

export type ResizeOptions = {
  readonly maxLongEdgePx: number;
  readonly jpegQuality: number;
};

export interface ImageResizer {
  /** 画像を長辺 maxLongEdgePx 以下に縮小し、JPEG として destinationPath に書く */
  resizeToJpeg(sourcePath: string, destinationPath: string, options: ResizeOptions): Promise<void>;
}

export type PhotoFilesDependencies = {
  readonly files: PhotoFileSystem;
  readonly resizer: ImageResizer;
  readonly logger: Logger;
};

/** URI から拡張子を取り出す（英数字 1〜5 文字のみ。それ以外は jpg） */
export function extensionOf(uri: string): string {
  const withoutQuery = uri.split(/[?#]/)[0] ?? uri;
  const match = /\.([A-Za-z0-9]{1,5})$/.exec(withoutQuery);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

async function deleteQuietly(files: PhotoFileSystem, path: string, logger: Logger): Promise<void> {
  try {
    await files.deleteFile(path);
  } catch (cause) {
    logger.warn(`写真ファイルを消せませんでした: ${path}`, cause);
  }
}

/** 原本のコピーと縮小版の生成を1つの操作として行う。失敗したら途中で作ったファイルを消す。 */
export async function importPhoto(
  deps: PhotoFilesDependencies,
  sourceUri: string,
  catchId: string,
): Promise<StoreResult<ImportedPhoto>> {
  const { files, resizer, logger } = deps;
  const photoPath = files.photoPathFor(catchId, extensionOf(sourceUri));
  const thumbnailPath = files.thumbnailPathFor(catchId);
  try {
    await files.copyFile(sourceUri, photoPath);
    await resizer.resizeToJpeg(photoPath, thumbnailPath, {
      maxLongEdgePx: THUMBNAIL_LONG_EDGE_PX,
      jpegQuality: THUMBNAIL_JPEG_QUALITY,
    });
    return { ok: true, value: { photoPath, thumbnailPath } };
  } catch (cause) {
    await deleteQuietly(files, thumbnailPath, logger);
    await deleteQuietly(files, photoPath, logger);
    return { ok: false, error: { reason: '写真の取り込みに失敗しました', cause } };
  }
}

/** 原本と縮小版を消す。失敗は記録するだけで呼び出し元には返さない（BR3.2）。 */
export async function removePhotoFiles(
  deps: Pick<PhotoFilesDependencies, 'files' | 'logger'>,
  photo: ImportedPhoto,
): Promise<void> {
  await deleteQuietly(deps.files, photo.thumbnailPath, deps.logger);
  await deleteQuietly(deps.files, photo.photoPath, deps.logger);
}

// テスト用の写真ファイル実装（一時ディレクトリの実ファイル）と、固定バイト列を書くフェイクの縮小器。
import { access, copyFile, mkdir, mkdtemp, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ImageResizer, PhotoFileSystem } from '../photo-files';

export type TempPhotoFileSystem = PhotoFileSystem & {
  readonly root: string;
  exists(path: string): Promise<boolean>;
  /** 一時ディレクトリごと消す */
  cleanup(): Promise<void>;
  /** 次の deleteFile を失敗させる（BR3.2 のファイル削除失敗のテスト用） */
  failNextDelete(message: string): void;
};

export async function createTempPhotoFileSystem(): Promise<TempPhotoFileSystem> {
  const root = await mkdtemp(join(tmpdir(), 'catches-test-'));
  const photosDirectory = join(root, 'photos');
  const thumbnailsDirectory = join(root, 'thumbnails');
  let deleteFailure: string | null = null;

  async function exists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  return {
    root,
    exists,
    async cleanup() {
      await rm(root, { recursive: true, force: true });
    },
    failNextDelete(message) {
      deleteFailure = message;
    },
    async ensureDirectories() {
      await mkdir(photosDirectory, { recursive: true });
      await mkdir(thumbnailsDirectory, { recursive: true });
    },
    photoPathFor(catchId, extension) {
      return join(photosDirectory, `${catchId}.${extension}`);
    },
    thumbnailPathFor(catchId) {
      return join(thumbnailsDirectory, `${catchId}.jpg`);
    },
    async copyFile(sourceUri, destinationPath) {
      await copyFile(sourceUri, destinationPath);
    },
    async deleteFile(path) {
      if (deleteFailure !== null) {
        const message = deleteFailure;
        deleteFailure = null;
        throw new Error(message);
      }
      try {
        await unlink(path);
      } catch (cause) {
        if ((cause as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw cause;
        }
      }
    },
  };
}

/** 架空の写真バイト列（実データは使わない） */
export const FAKE_PHOTO_BYTES = Buffer.from('FAKE-PHOTO-ORIGINAL');
export const FAKE_THUMBNAIL_BYTES = Buffer.from('FAKE-THUMBNAIL');

/** 一時ディレクトリに架空の元写真を作り、そのパスを返す */
export async function writeFakeSourcePhoto(
  files: TempPhotoFileSystem,
  name = 'source.png',
): Promise<string> {
  const path = join(files.root, name);
  await writeFile(path, FAKE_PHOTO_BYTES);
  return path;
}

export type FakeResizer = ImageResizer & {
  readonly calls: { sourcePath: string; destinationPath: string }[];
  failWith(message: string): void;
};

/** 縮小の代わりに固定バイト列を書くフェイク。失敗を差し込める。 */
export function createFakeResizer(): FakeResizer {
  const calls: FakeResizer['calls'] = [];
  let failure: string | null = null;
  return {
    calls,
    failWith(message) {
      failure = message;
    },
    async resizeToJpeg(sourcePath, destinationPath) {
      calls.push({ sourcePath, destinationPath });
      if (failure !== null) {
        const message = failure;
        failure = null;
        throw new Error(message);
      }
      await writeFile(destinationPath, FAKE_THUMBNAIL_BYTES);
    },
  };
}

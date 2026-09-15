import { readFile } from 'node:fs/promises';
import type { Logger } from '../../log/logger';
import { extensionOf, importPhoto, removePhotoFiles } from '../photo-files';
import {
  createFakeResizer,
  createTempPhotoFileSystem,
  FAKE_PHOTO_BYTES,
  FAKE_THUMBNAIL_BYTES,
  writeFakeSourcePhoto,
  type TempPhotoFileSystem,
} from './temp-photo-files';

function createRecordingLogger(): Logger & { warnings: string[] } {
  const warnings: string[] = [];
  return {
    warnings,
    warn: (message) => {
      warnings.push(message);
    },
    error: () => undefined,
  };
}

describe('importPhoto', () => {
  let files: TempPhotoFileSystem;

  beforeEach(async () => {
    files = await createTempPhotoFileSystem();
    await files.ensureDirectories();
  });

  afterEach(async () => {
    await files.cleanup();
  });

  it('原本をコピーし縮小版を生成して、両方のパスを返す（BR4.3）', async () => {
    const source = await writeFakeSourcePhoto(files, 'source.png');
    const resizer = createFakeResizer();
    const result = await importPhoto(
      { files, resizer, logger: createRecordingLogger() },
      source,
      'catch-1',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.photoPath).toBe(files.photoPathFor('catch-1', 'png'));
      expect(result.value.thumbnailPath).toBe(files.thumbnailPathFor('catch-1'));
      expect(await readFile(result.value.photoPath)).toEqual(FAKE_PHOTO_BYTES);
      expect(await readFile(result.value.thumbnailPath)).toEqual(FAKE_THUMBNAIL_BYTES);
    }
    expect(resizer.calls).toEqual([
      {
        sourcePath: files.photoPathFor('catch-1', 'png'),
        destinationPath: files.thumbnailPathFor('catch-1'),
      },
    ]);
  });

  it('縮小に失敗すると失敗を返し、コピー済みの原本を消す（BR4.3）', async () => {
    const source = await writeFakeSourcePhoto(files);
    const resizer = createFakeResizer();
    resizer.failWith('縮小に失敗');
    const result = await importPhoto(
      { files, resizer, logger: createRecordingLogger() },
      source,
      'catch-2',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.cause).toBeInstanceOf(Error);
    }
    expect(await files.exists(files.photoPathFor('catch-2', 'png'))).toBe(false);
    expect(await files.exists(files.thumbnailPathFor('catch-2'))).toBe(false);
  });

  it('元の写真が読めない（コピー失敗）と失敗を返し、ファイルを残さない', async () => {
    const result = await importPhoto(
      { files, resizer: createFakeResizer(), logger: createRecordingLogger() },
      `${files.root}/missing.jpg`,
      'catch-3',
    );
    expect(result.ok).toBe(false);
    expect(await files.exists(files.photoPathFor('catch-3', 'jpg'))).toBe(false);
  });

  it('後始末のファイル削除に失敗しても失敗の結果は変わらず、記録に残る', async () => {
    const source = await writeFakeSourcePhoto(files);
    const resizer = createFakeResizer();
    resizer.failWith('縮小に失敗');
    const logger = createRecordingLogger();
    files.failNextDelete('消せない');
    const result = await importPhoto({ files, resizer, logger }, source, 'catch-4');
    expect(result.ok).toBe(false);
    expect(logger.warnings).toHaveLength(1);
  });
});

describe('removePhotoFiles', () => {
  it('原本と縮小版を消し、無いファイルでもエラーにしない', async () => {
    const files = await createTempPhotoFileSystem();
    await files.ensureDirectories();
    const source = await writeFakeSourcePhoto(files);
    const imported = await importPhoto(
      { files, resizer: createFakeResizer(), logger: createRecordingLogger() },
      source,
      'catch-5',
    );
    expect(imported.ok).toBe(true);
    if (imported.ok) {
      const logger = createRecordingLogger();
      await removePhotoFiles({ files, logger }, imported.value);
      expect(await files.exists(imported.value.photoPath)).toBe(false);
      expect(await files.exists(imported.value.thumbnailPath)).toBe(false);
      // 2回目（すでに無い）でも例外にならない
      await removePhotoFiles({ files, logger }, imported.value);
      expect(logger.warnings).toEqual([]);
    }
    await files.cleanup();
  });

  it('削除に失敗しても例外を投げず、警告として記録する', async () => {
    const files = await createTempPhotoFileSystem();
    const logger = createRecordingLogger();
    files.failNextDelete('権限がない');
    await removePhotoFiles({ files, logger }, { photoPath: 'p', thumbnailPath: 't' });
    expect(logger.warnings).toHaveLength(1);
    await files.cleanup();
  });
});

describe('extensionOf', () => {
  it('拡張子を小文字で返す', () => {
    expect(extensionOf('file:///tmp/IMG_0001.JPG')).toBe('jpg');
    expect(extensionOf('/tmp/photo.heic')).toBe('heic');
  });

  it('拡張子がない・長すぎる・クエリ付きのときは jpg か本来の拡張子', () => {
    expect(extensionOf('content://media/external/images/123')).toBe('jpg');
    expect(extensionOf('/tmp/photo.toolongext')).toBe('jpg');
    expect(extensionOf('file:///tmp/photo.png?x=1')).toBe('png');
  });
});

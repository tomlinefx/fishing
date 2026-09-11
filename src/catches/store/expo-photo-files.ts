// expo-file-system と expo-image-manipulator による本番実装。
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImageResizer, PhotoFileSystem, ResizeOptions } from './photo-files';

/** アプリ専用領域の写真ディレクトリ: documentDirectory/catches/{photos,thumbnails}/ */
export function createExpoPhotoFileSystem(
  rootDirectory: Directory = new Directory(Paths.document, 'catches'),
): PhotoFileSystem {
  const photosDirectory = new Directory(rootDirectory, 'photos');
  const thumbnailsDirectory = new Directory(rootDirectory, 'thumbnails');

  return {
    async ensureDirectories() {
      photosDirectory.create({ intermediates: true, idempotent: true });
      thumbnailsDirectory.create({ intermediates: true, idempotent: true });
    },
    photoPathFor(catchId, extension) {
      return new File(photosDirectory, `${catchId}.${extension}`).uri;
    },
    thumbnailPathFor(catchId) {
      return new File(thumbnailsDirectory, `${catchId}.jpg`).uri;
    },
    async copyFile(sourceUri, destinationPath) {
      await new File(sourceUri).copy(new File(destinationPath), { overwrite: true });
    },
    async deleteFile(path) {
      const file = new File(path);
      if (file.exists) {
        file.delete();
      }
    },
  };
}

/** 長辺を maxLongEdgePx 以下に収める寸法を計算する（拡大はしない） */
export function computeResizeTarget(
  width: number,
  height: number,
  maxLongEdgePx: number,
): { width?: number; height?: number } {
  if (width <= maxLongEdgePx && height <= maxLongEdgePx) {
    return {};
  }
  // 片方だけ指定すると縦横比を保って他方が計算される
  return width >= height ? { width: maxLongEdgePx } : { height: maxLongEdgePx };
}

export function createExpoImageResizer(): ImageResizer {
  return {
    async resizeToJpeg(sourcePath: string, destinationPath: string, options: ResizeOptions) {
      const original = await ImageManipulator.manipulate(sourcePath).renderAsync();
      try {
        const target = computeResizeTarget(original.width, original.height, options.maxLongEdgePx);
        const context = ImageManipulator.manipulate(original);
        if (target.width !== undefined || target.height !== undefined) {
          context.resize(target);
        }
        const rendered = await context.renderAsync();
        try {
          const saved = await rendered.saveAsync({
            compress: options.jpegQuality,
            format: SaveFormat.JPEG,
          });
          await new File(saved.uri).move(new File(destinationPath), { overwrite: true });
        } finally {
          rendered.release();
        }
      } finally {
        original.release();
      }
    },
  };
}

// expo-file-system / expo-image-manipulator の呼び出しへの対応付けを、モックで確認する。
import {
  computeResizeTarget,
  createExpoImageResizer,
  createExpoPhotoFileSystem,
} from '../expo-photo-files';

type FakeEntry = { uri: string };

// jest.mock の工場から参照する変数は mock で始める必要がある
const mockState = {
  created: [] as { uri: string; options: unknown }[],
  copies: [] as { from: string; to: string; options: unknown }[],
  moves: [] as { from: string; to: string; options: unknown }[],
  deleted: [] as string[],
  existing: new Set<string>(),
  manipulatorCalls: [] as { source: unknown; resize: unknown[] }[],
  releases: [] as string[],
  originalSize: { width: 4000, height: 3000 },
};

function mockJoinUri(parts: (string | FakeEntry)[]): string {
  return parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
}

jest.mock('expo-file-system', () => {
  class Directory {
    readonly uri: string;
    constructor(...parts: (string | FakeEntry)[]) {
      this.uri = mockJoinUri(parts);
    }
    create(options: unknown) {
      mockState.created.push({ uri: this.uri, options });
    }
  }
  class File {
    readonly uri: string;
    constructor(...parts: (string | FakeEntry)[]) {
      this.uri = mockJoinUri(parts);
    }
    get exists() {
      return mockState.existing.has(this.uri);
    }
    async copy(destination: FakeEntry, options: unknown) {
      mockState.copies.push({ from: this.uri, to: destination.uri, options });
    }
    async move(destination: FakeEntry, options: unknown) {
      mockState.moves.push({ from: this.uri, to: destination.uri, options });
    }
    delete() {
      mockState.deleted.push(this.uri);
    }
  }
  return { Directory, File, Paths: { document: new Directory('file:///documents') } };
});

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate(source: unknown) {
      const call = { source, resize: [] as unknown[] };
      mockState.manipulatorCalls.push(call);
      return {
        resize(size: unknown) {
          call.resize.push(size);
          return this;
        },
        async renderAsync() {
          return {
            width: mockState.originalSize.width,
            height: mockState.originalSize.height,
            release: () => {
              mockState.releases.push(typeof source === 'string' ? 'original' : 'resized');
            },
            saveAsync: jest.fn(async () => ({
              uri: 'file:///cache/rendered.jpg',
              width: 480,
              height: 360,
            })),
          };
        },
      };
    },
  },
}));

beforeEach(() => {
  mockState.created.length = 0;
  mockState.copies.length = 0;
  mockState.moves.length = 0;
  mockState.deleted.length = 0;
  mockState.existing.clear();
  mockState.manipulatorCalls.length = 0;
  mockState.releases.length = 0;
  mockState.originalSize = { width: 4000, height: 3000 };
});

describe('createExpoPhotoFileSystem', () => {
  it('アプリ専用領域の catches/photos と catches/thumbnails を作る（NFR6）', async () => {
    const files = createExpoPhotoFileSystem();
    await files.ensureDirectories();
    expect(mockState.created).toEqual([
      {
        uri: 'file:///documents/catches/photos',
        options: { intermediates: true, idempotent: true },
      },
      {
        uri: 'file:///documents/catches/thumbnails',
        options: { intermediates: true, idempotent: true },
      },
    ]);
  });

  it('保存先のパスは id と拡張子から決まり、縮小版は常に jpg', () => {
    const files = createExpoPhotoFileSystem();
    expect(files.photoPathFor('abc', 'png')).toBe('file:///documents/catches/photos/abc.png');
    expect(files.thumbnailPathFor('abc')).toBe('file:///documents/catches/thumbnails/abc.jpg');
  });

  it('コピーは上書き可で行い、削除は存在するときだけ行う', async () => {
    const files = createExpoPhotoFileSystem();
    await files.copyFile('file:///cache/src.jpg', 'file:///documents/catches/photos/a.jpg');
    expect(mockState.copies).toEqual([
      {
        from: 'file:///cache/src.jpg',
        to: 'file:///documents/catches/photos/a.jpg',
        options: { overwrite: true },
      },
    ]);
    await files.deleteFile('file:///missing.jpg');
    expect(mockState.deleted).toEqual([]);
    mockState.existing.add('file:///present.jpg');
    await files.deleteFile('file:///present.jpg');
    expect(mockState.deleted).toEqual(['file:///present.jpg']);
  });
});

describe('computeResizeTarget', () => {
  it('横長は幅を、縦長は高さを長辺に合わせる', () => {
    expect(computeResizeTarget(4000, 3000, 480)).toEqual({ width: 480 });
    expect(computeResizeTarget(3000, 4000, 480)).toEqual({ height: 480 });
  });

  it('長辺が上限以下なら拡大しない', () => {
    expect(computeResizeTarget(300, 200, 480)).toEqual({});
    expect(computeResizeTarget(480, 480, 480)).toEqual({});
  });
});

describe('createExpoImageResizer', () => {
  const options = { maxLongEdgePx: 480, jpegQuality: 0.7 };

  it('長辺 480px に縮小し、JPEG 品質 0.7 で保存して目的地へ移す（ADR-003）', async () => {
    const resizer = createExpoImageResizer();
    await resizer.resizeToJpeg('file:///photos/a.jpg', 'file:///thumbnails/a.jpg', options);
    expect(mockState.manipulatorCalls).toHaveLength(2);
    expect(mockState.manipulatorCalls[0]?.source).toBe('file:///photos/a.jpg');
    expect(mockState.manipulatorCalls[1]?.resize).toEqual([{ width: 480 }]);
    expect(mockState.moves).toEqual([
      {
        from: 'file:///cache/rendered.jpg',
        to: 'file:///thumbnails/a.jpg',
        options: { overwrite: true },
      },
    ]);
    expect(mockState.releases.sort()).toEqual(['original', 'resized']);
  });

  it('元が小さければ縮小せずに JPEG 化だけ行う', async () => {
    mockState.originalSize = { width: 320, height: 240 };
    const resizer = createExpoImageResizer();
    await resizer.resizeToJpeg('file:///photos/s.png', 'file:///thumbnails/s.jpg', options);
    expect(mockState.manipulatorCalls[1]?.resize).toEqual([]);
    expect(mockState.moves).toHaveLength(1);
  });
});

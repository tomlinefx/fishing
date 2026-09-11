// テストデータ生成ヘルパー（team.md: 架空の名前・架空の写真を使う）
import type { Catch, CatchInput } from '../log/catch';

/** 固定の時刻（テストで実時刻に依存しないため） */
export const FIXED_NOW = new Date(2026, 8, 11, 14, 5, 0); // 2026/9/11 14:05 ローカル時刻

/** 釣果1件を作る。指定しない項目は架空の既定値。 */
export function makeCatch(overrides: Partial<Catch> = {}): Catch {
  const id = overrides.id ?? 'catch-0001';
  return {
    id,
    photoPath: `photos/${id}.jpg`,
    thumbnailPath: `thumbnails/${id}.jpg`,
    species: 'テストアジ',
    sizeCm: 25.5,
    weightG: 120,
    placeName: 'テスト釣り場',
    caughtAt: FIXED_NOW,
    ...overrides,
  };
}

/** 登録画面からの入力を作る。指定しない項目は写真あり・他は空。 */
export function makeCatchInput(overrides: Partial<CatchInput> = {}): CatchInput {
  return {
    photoUri: 'file:///tmp/test-photo.jpg',
    species: '',
    sizeCm: '',
    weightG: '',
    placeName: '',
    ...overrides,
  };
}

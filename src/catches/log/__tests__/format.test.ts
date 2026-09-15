import { makeCatch } from '../../__tests__/fixtures';
import { messages } from '../../messages';
import {
  formatDetailDateTime,
  formatListDate,
  formatMeasurements,
  formatPhotoAltText,
  formatSizeCm,
  formatWeightG,
} from '../format';

const NOW = new Date(2026, 8, 11, 14, 5);

describe('formatListDate', () => {
  it('当年は「M/D」（0 埋めなし）', () => {
    expect(formatListDate(new Date(2026, 0, 5), NOW)).toBe('1/5');
  });

  it('当年以外は「YYYY/M/D」', () => {
    expect(formatListDate(new Date(2025, 11, 31), NOW)).toBe('2025/12/31');
  });

  it('年の境界: 同じ年の 12/31 は年を出さない', () => {
    expect(formatListDate(new Date(2026, 11, 31), NOW)).toBe('12/31');
  });
});

describe('formatDetailDateTime', () => {
  it('「YYYY/M/D H:mm」で分は 0 埋め', () => {
    expect(formatDetailDateTime(new Date(2026, 8, 11, 9, 5))).toBe('2026/9/11 9:05');
  });

  it('0 時 0 分は「0:00」', () => {
    expect(formatDetailDateTime(new Date(2026, 0, 1, 0, 0))).toBe('2026/1/1 0:00');
  });
});

describe('サイズ／重さの表記', () => {
  it('サイズは整数なら小数点なし、小数なら1桁', () => {
    expect(formatSizeCm(25)).toBe('25cm');
    expect(formatSizeCm(25.5)).toBe('25.5cm');
  });

  it('重さは「g」付き', () => {
    expect(formatWeightG(120)).toBe('120g');
  });

  it('両方あれば「 / 」でつなぎ、片方だけならそれだけ、両方未入力なら null（BR7.2）', () => {
    expect(formatMeasurements({ sizeCm: 25.5, weightG: 120 })).toBe('25.5cm / 120g');
    expect(formatMeasurements({ sizeCm: 25.5, weightG: null })).toBe('25.5cm');
    expect(formatMeasurements({ sizeCm: null, weightG: 120 })).toBe('120g');
    expect(formatMeasurements({ sizeCm: null, weightG: null })).toBeNull();
  });
});

describe('formatPhotoAltText', () => {
  it('魚種・サイズ・場所をつないで「の写真」を付ける（NFR7）', () => {
    expect(formatPhotoAltText(makeCatch())).toBe('テストアジ 25.5cm テスト釣り場 の写真');
  });

  it('未入力の項目は省く', () => {
    expect(formatPhotoAltText(makeCatch({ sizeCm: null, placeName: null }))).toBe(
      'テストアジ の写真',
    );
  });

  it('すべて未入力なら既定の文言', () => {
    expect(formatPhotoAltText(makeCatch({ species: null, sizeCm: null, placeName: null }))).toBe(
      messages.list.photoAltFallback,
    );
  });
});

// 一覧・詳細の表示整形。日付の形式は functional-spec.md の Assumptions で決めた値。
import { messages } from '../messages';
import type { Catch } from './catch';

/** 一覧の日付: 当年は「M/D」、当年以外は「YYYY/M/D」 */
export function formatListDate(caughtAt: Date, now: Date): string {
  const monthDay = `${caughtAt.getMonth() + 1}/${caughtAt.getDate()}`;
  if (caughtAt.getFullYear() === now.getFullYear()) {
    return monthDay;
  }
  return `${caughtAt.getFullYear()}/${monthDay}`;
}

/** 詳細の日時: 「YYYY/M/D H:mm」 */
export function formatDetailDateTime(caughtAt: Date): string {
  const minutes = String(caughtAt.getMinutes()).padStart(2, '0');
  return `${caughtAt.getFullYear()}/${caughtAt.getMonth() + 1}/${caughtAt.getDate()} ${caughtAt.getHours()}:${minutes}`;
}

/** サイズの表記: 「25cm」「25.5cm」 */
export function formatSizeCm(sizeCm: number): string {
  return `${sizeCm}cm`;
}

/** 重さの表記: 「120g」 */
export function formatWeightG(weightG: number): string {
  return `${weightG}g`;
}

/** サイズ／重さを1行にまとめる。両方未入力なら null（BR7.2: 未入力は表示しない） */
export function formatMeasurements(catchRecord: Pick<Catch, 'sizeCm' | 'weightG'>): string | null {
  const parts: string[] = [];
  if (catchRecord.sizeCm !== null) {
    parts.push(formatSizeCm(catchRecord.sizeCm));
  }
  if (catchRecord.weightG !== null) {
    parts.push(formatWeightG(catchRecord.weightG));
  }
  return parts.length === 0 ? null : parts.join(' / ');
}

/** 写真の代替テキスト: 「{魚種} {サイズ}cm {場所} の写真」（未入力は省く、NFR7） */
export function formatPhotoAltText(
  catchRecord: Pick<Catch, 'species' | 'sizeCm' | 'placeName'>,
): string {
  const parts: string[] = [];
  if (catchRecord.species !== null) {
    parts.push(catchRecord.species);
  }
  if (catchRecord.sizeCm !== null) {
    parts.push(formatSizeCm(catchRecord.sizeCm));
  }
  if (catchRecord.placeName !== null) {
    parts.push(catchRecord.placeName);
  }
  if (parts.length === 0) {
    return messages.list.photoAltFallback;
  }
  return `${parts.join(' ')} ${messages.list.photoAltSuffix}`;
}

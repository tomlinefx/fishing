// 登録時の入力検証（BR1.1〜BR1.4）。画面→ロジックの境界で1回だけ行う。
import { messages } from '../messages';
import type { CatchInput } from './catch';

/** 魚種・場所の最大文字数（entities.md の設計上の目安） */
export const MAX_TEXT_LENGTH = 50;

/** 検証を通過した値。数値項目は数値に、空の任意項目は null になっている。 */
export type ValidatedCatchFields = {
  readonly photoUri: string;
  readonly species: string | null;
  readonly sizeCm: number | null;
  readonly weightG: number | null;
  readonly placeName: string | null;
};

export type CatchField = 'photo' | 'species' | 'sizeCm' | 'weightG' | 'placeName';

/** 項目ごとの検証文言。違反のない項目は含まれない。 */
export type FieldErrors = Partial<Record<CatchField, string>>;

export type ValidationResult =
  | { readonly ok: true; readonly value: ValidatedCatchFields }
  | { readonly ok: false; readonly errors: FieldErrors };

// 0 以上、小数第1位まで（BR1.2）。負号は許さない。
const SIZE_PATTERN = /^\d+(\.\d)?$/;
// 0 以上の整数（BR1.3）
const WEIGHT_PATTERN = /^\d+$/;

/** 文字数はサロゲートペアを1文字として数える */
function countCharacters(text: string): number {
  return Array.from(text).length;
}

/** 前後の空白を除き、空なら未入力（null）として扱う（BR1.4） */
export function normalizeText(text: string): string | null {
  const trimmed = text.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function validateTextField(text: string): { value: string | null; error?: string } {
  const value = normalizeText(text);
  if (value !== null && countCharacters(value) > MAX_TEXT_LENGTH) {
    return { value, error: messages.errors.tooLong };
  }
  return { value };
}

function validateSize(text: string): { value: number | null; error?: string } {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { value: null };
  }
  if (!SIZE_PATTERN.test(trimmed)) {
    return { value: null, error: messages.errors.sizeInvalid };
  }
  return { value: Number(trimmed) };
}

function validateWeight(text: string): { value: number | null; error?: string } {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { value: null };
  }
  if (!WEIGHT_PATTERN.test(trimmed)) {
    return { value: null, error: messages.errors.weightInvalid };
  }
  return { value: Number(trimmed) };
}

/** 登録画面の入力を検証する。違反があれば項目ごとの文言をすべて返す（1項目ずつ止めない）。 */
export function validateCatchInput(input: CatchInput): ValidationResult {
  const errors: FieldErrors = {};

  const photoUri = input.photoUri?.trim() ?? '';
  if (photoUri.length === 0) {
    errors.photo = messages.errors.photoRequired; // BR1.1
  }

  const species = validateTextField(input.species);
  if (species.error) {
    errors.species = species.error;
  }

  const sizeCm = validateSize(input.sizeCm);
  if (sizeCm.error) {
    errors.sizeCm = sizeCm.error;
  }

  const weightG = validateWeight(input.weightG);
  if (weightG.error) {
    errors.weightG = weightG.error;
  }

  const placeName = validateTextField(input.placeName);
  if (placeName.error) {
    errors.placeName = placeName.error;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      photoUri,
      species: species.value,
      sizeCm: sizeCm.value,
      weightG: weightG.value,
      placeName: placeName.value,
    },
  };
}

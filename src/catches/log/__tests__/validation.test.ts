import { makeCatchInput } from '../../__tests__/fixtures';
import { messages } from '../../messages';
import { MAX_TEXT_LENGTH, normalizeText, validateCatchInput } from '../validation';

describe('validateCatchInput', () => {
  it('写真がないと「写真を添付してください」を返す（BR1.1）', () => {
    const result = validateCatchInput(makeCatchInput({ photoUri: null }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.photo).toBe(messages.errors.photoRequired);
    }
  });

  it('写真の参照が空白だけでも未添付として扱う（BR1.1）', () => {
    const result = validateCatchInput(makeCatchInput({ photoUri: '   ' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.photo).toBe(messages.errors.photoRequired);
    }
  });

  it('サイズ「abc」は数値エラーになる（BR1.2）', () => {
    const result = validateCatchInput(makeCatchInput({ sizeCm: 'abc' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.sizeCm).toBe(messages.errors.sizeInvalid);
    }
  });

  it('サイズ「25.55」（小数2桁）はエラーになる（BR1.2）', () => {
    const result = validateCatchInput(makeCatchInput({ sizeCm: '25.55' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.sizeCm).toBe(messages.errors.sizeInvalid);
    }
  });

  it('サイズ「25.5」と「0」は通り、数値になる（BR1.2）', () => {
    const decimal = validateCatchInput(makeCatchInput({ sizeCm: '25.5' }));
    expect(decimal.ok).toBe(true);
    if (decimal.ok) {
      expect(decimal.value.sizeCm).toBe(25.5);
    }
    const zero = validateCatchInput(makeCatchInput({ sizeCm: '0' }));
    expect(zero.ok).toBe(true);
    if (zero.ok) {
      expect(zero.value.sizeCm).toBe(0);
    }
  });

  it('重さ「120.5」（小数）はエラーになる（BR1.3）', () => {
    const result = validateCatchInput(makeCatchInput({ weightG: '120.5' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.weightG).toBe(messages.errors.weightInvalid);
    }
  });

  it('負の値はサイズも重さもエラーになる（BR1.2、BR1.3）', () => {
    const result = validateCatchInput(makeCatchInput({ sizeCm: '-1', weightG: '-5' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.sizeCm).toBe(messages.errors.sizeInvalid);
      expect(result.errors.weightG).toBe(messages.errors.weightInvalid);
    }
  });

  it('魚種が 51 文字だとエラー、50 文字は通る（BR1.4）', () => {
    const tooLong = 'あ'.repeat(MAX_TEXT_LENGTH + 1);
    const justFits = 'あ'.repeat(MAX_TEXT_LENGTH);
    const failed = validateCatchInput(makeCatchInput({ species: tooLong }));
    expect(failed.ok).toBe(false);
    if (!failed.ok) {
      expect(failed.errors.species).toBe(messages.errors.tooLong);
    }
    const passed = validateCatchInput(makeCatchInput({ species: justFits }));
    expect(passed.ok).toBe(true);
  });

  it('場所の文字数はサロゲートペアを1文字として数える（BR1.4）', () => {
    const emoji50 = '🐟'.repeat(MAX_TEXT_LENGTH);
    const result = validateCatchInput(makeCatchInput({ placeName: emoji50 }));
    expect(result.ok).toBe(true);
  });

  it('魚種と場所の前後の空白を除く（BR1.4）', () => {
    const result = validateCatchInput(
      makeCatchInput({ species: '  テストアジ ', placeName: '\tテスト釣り場\n' }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.species).toBe('テストアジ');
      expect(result.value.placeName).toBe('テスト釣り場');
    }
  });

  it('写真だけあって任意項目がすべて空でも通り、未入力は null になる', () => {
    const result = validateCatchInput(makeCatchInput({ species: '   ', sizeCm: ' ', weightG: '' }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        photoUri: 'file:///tmp/test-photo.jpg',
        species: null,
        sizeCm: null,
        weightG: null,
        placeName: null,
      });
    }
  });

  it('複数の違反を1回でまとめて返す', () => {
    const result = validateCatchInput(
      makeCatchInput({ photoUri: null, sizeCm: 'x', weightG: '1.5', placeName: 'a'.repeat(60) }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        'photo',
        'placeName',
        'sizeCm',
        'weightG',
      ]);
    }
  });
});

describe('normalizeText', () => {
  it('空白だけの文字列は null になる', () => {
    expect(normalizeText('   ')).toBeNull();
  });

  it('前後の空白を除いた文字列を返す', () => {
    expect(normalizeText(' アジ ')).toBe('アジ');
  });
});

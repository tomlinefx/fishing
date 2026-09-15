// 画面の見た目の共通値。タップ領域は 44px 以上（NFR7）。
export const MIN_TAP_SIZE = 44;
export const ADD_BUTTON_SIZE = 56;

export const colors = {
  background: '#FFFFFF',
  surface: '#F4F6F8',
  border: '#D9DEE3',
  text: '#1B1F23',
  textMuted: '#5F6B76',
  primary: '#1E6FD9',
  onPrimary: '#FFFFFF',
  danger: '#C62828',
  dangerSurface: '#FDECEA',
  chipSelected: '#1E6FD9',
  chipSelectedText: '#FFFFFF',
  skeleton: '#E4E8EC',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

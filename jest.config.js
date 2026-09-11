// Jest の設定（team.md Testing Posture: 層別のカバレッジ床）
// - ロジック層（src/catches/log/）と保存層（src/catches/store/）は行カバレッジ 80% 以上を必須にする
// - 画面層（src/catches/ui/、app/）は計測のみで閾値なし
// この閾値はテストを通すために下げない。
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/aidlc/', '<rootDir>/.claude/'],
  modulePathIgnorePatterns: ['<rootDir>/aidlc/', '<rootDir>/.claude/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', '!**/__tests__/**'],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    './src/catches/log/': { lines: 80 },
    './src/catches/store/': { lines: 80 },
  },
};

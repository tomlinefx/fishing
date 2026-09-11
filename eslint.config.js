// ESLint の設定（team.md Code Style: リンタ必須、テストコードも対象）
const expoConfig = require('eslint-config-expo/flat');
const { defineConfig, globalIgnores } = require('eslint/config');
const globals = require('globals');

module.exports = defineConfig([
  globalIgnores([
    'node_modules/',
    'aidlc/',
    '.claude/',
    '.expo/',
    'coverage/',
    'android/',
    'ios/',
    'expo-env.d.ts',
  ]),
  expoConfig,
  {
    // テストコード: Jest のグローバルを許可する
    files: ['**/__tests__/**/*.[jt]s?(x)'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
  {
    // 設定ファイルは CommonJS（Node）
    files: ['*.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]);

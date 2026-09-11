# Unit Test Instructions — catches

## Sources

- 計画: `code-generation-plan.md`（Testing Contract、Step 3／6／8／11）
- チームルール: `aidlc/spaces/default/memory/team.md`（Testing Posture: test-after、ロジック → 保存 → 画面、行カバレッジ 80%）

## Test Framework Setup（テストの道具と設定）

- ランナー: Jest（preset `jest-expo`）。画面は `@testing-library/react-native`
- 保存層のテスト: `better-sqlite3`（devDependency）によるメモリ内 SQLite を、本番と同じ `sql-driver.ts` のインタフェース越しに使う。写真ファイルの操作は一時ディレクトリの実装に差し替える
- 設定ファイル: `jest.config.js`（`collectCoverageFrom: ['src/**/*.{ts,tsx}', 'app/**/*.tsx']`、`coverageReporters: ['text', 'lcov']`、`coverageThreshold: { './src/catches/log/': { lines: 80 }, './src/catches/store/': { lines: 80 } }`）
- テストコードもリンタとフォーマッタの対象（`eslint.config.js`、`.prettierrc`）

## How to Run This Unit's Tests（この単位のテストの実行方法）

この単位（catches）のテストだけを実行する正確なコマンド（リポジトリ直下で実行）:

```
npx jest --coverage --rootDir . src/catches app
```

層ごとの実行:

- ロジック層: `npx jest --coverage --rootDir . src/catches/log`
- 保存層: `npx jest --coverage --rootDir . src/catches/store`
- 画面層: `npx jest --coverage --rootDir . src/catches/ui app`

1コマンドの入口（整形チェック → リント → 型検査 → テスト＋カバレッジ）: `npm run check`。マージ前はこれが緑であること（team.md の暫定ゲート）。

テストランナーは Step 3 で整え、最初のテスト（Step 6）より前に上記コマンドが空のテスト1本で緑になることを確認する。

## Coverage Targets（カバレッジの目標）

| 対象 | 行カバレッジ | 扱い |
|------|--------------|------|
| `src/catches/log/`（ロジック層） | 80% 以上 | 必須。`jest.config.js` の閾値で強制 |
| `src/catches/store/`（保存層） | 80% 以上 | 必須。同上 |
| `src/catches/ui/`、`app/`（画面層） | 閾値なし | 計測して結果を残す |

閾値は通すために下げない（team.md）。不足したらテストを足す。

## Test Volume（本数の目安、Standard）

| 対象 | 本数の目安 | 必ず含めるもの |
|------|------------|----------------|
| validation（ロジック） | 8 本以上 | 写真なし、サイズ小数2桁、重さ小数、負の値、51 文字、空白除去 |
| catch-log（ロジック） | 7 本以上 | 固定の時計と ID、新しい順、AND 絞り込み、候補の重複なし、保存失敗の理由 |
| format（ロジック） | 3 本以上 | 当年／当年以外の日付 |
| catch-repository（保存） | 8 本以上 | 永続化（開き直しても残る）、削除で2ファイルも消える、ファイル削除失敗でも行は消える |
| photo-files、init（保存） | 5 本以上 | 縮小失敗で途中ファイルが消える、初期化失敗が致命的 |
| 画面 3 つ＋PhotoPicker | 19 本以上 | 空の状態、検証文言、保存中無効化、入力保持、破棄確認、削除確認、許可拒否の案内 |

合計 50 本前後（目安 25〜40 本を上回るが、画面層の分が多いだけで、ロジック・保存層は目安内）。各ファイルに異常系・境界を2つ以上。実装に関わらず通るテストは書かない。

## Mocking / Stubbing（差し替えの方針）

- ロジック層のテスト: `store` はフェイク（メモリ内の配列）。`clock` と `idGenerator` は固定値を返す関数
- 保存層のテスト: SQL ドライバは `better-sqlite3`（メモリ内）。ファイル操作と縮小はテスト用実装（一時ディレクトリ、縮小は固定バイト列を書く）。expo の実モジュールは使わない
- 画面層のテスト: CatchLog はフェイク。`expo-image-picker`、`expo-linking`、`expo-router` は `jest.mock` で差し替え、許可の拒否／許可を切り替えられるようにする
- 時刻依存のテストは注入した時計で固定し、実時刻に依存させない

## Test Data（テストデータ）

- `src/catches/__tests__/fixtures.ts` に釣果1件を作るヘルパー（`makeCatch(overrides)`）を置き、各テストはこれを使う
- 写真は架空の小さな画像バイト列、場所名・魚種は架空の値（「テスト釣り場」「テストアジ」）。友達の実データや実在の座標は使わない
- テスト間でデータを共有しない（各テストでメモリ内 DB を作り直す）

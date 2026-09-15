# Integration Test Instructions — 釣果アプリ

## Sources

- 上流資料: `../catches/code-generation/unit-test-instructions.md`（unit-test-instructions）、`../catches/code-generation/code-summary.md`（code-summary）、`../catches/code-generation/code-generation-plan.md`（code-generation-plan の Testing Contract）
- チームルール: `aidlc/spaces/default/memory/team.md`（Test Strategy は Standard＝単体＋主要な境界の結合テスト、自動 E2E なし）

## Scope（この文書が扱う範囲）

Test Strategy が Standard のため、単体テストに加えて**主要な境界の結合テスト**を対象にする。作業単位は `catches` の1つだけなので「単位をまたぐ結合」は存在せず、結合の境界は単位の内部にある次の3つ:

| 境界 | 内容 | 実装での差し替え |
|------|------|------------------|
| ロジック層 ↔ 保存層 | 釣果の保存・一覧・絞り込み・削除・写真の取り込み | テストは実物の SQLite（`better-sqlite3`、メモリ内）と一時ディレクトリの実ファイルを使う |
| 保存層 ↔ OS（expo） | expo-sqlite / expo-file-system / expo-image-manipulator の呼び出し | `jest.mock` で差し替え、渡す引数の対応付けを検証 |
| 画面層 ↔ ロジック層 ↔ 画面遷移 | 一覧 → 登録 → 一覧 → 詳細 → 削除の通し | `expo-router/testing-library` の `renderRouter` |

## How to Run（実行方法）

```sh
# 結合テストを含む全体（マージ前ゲート）
npm run check

# この作業単位のテストだけ
npx jest --coverage --rootDir . src/catches app

# 境界ごと
npx jest --rootDir . src/catches/store          # ロジック層↔保存層、保存層↔OS
npx jest --rootDir . app/__tests__/routes.test.tsx  # 画面遷移の通し
```

## Test Inventory（結合テストの内訳）

| ファイル | 本数 | 検証している境界の振る舞い |
|----------|------|----------------------------|
| `src/catches/store/__tests__/catch-repository.test.ts` | 13 | 保存して読める／新しい順／魚種と場所の AND 絞り込み／重複なしの候補／1件取得と不在／削除で行と写真2ファイルが消える／ファイル削除失敗でも行は消える／**ファイル DB を開き直しても残る（永続化、FR4.1）** |
| `src/catches/store/__tests__/photo-files.test.ts` | 8 | 原本のコピーと縮小版の生成／途中で失敗したら作ったファイルを消す（BR4.3） |
| `src/catches/store/__tests__/init.test.ts` | 6 | 保存領域の初期化成功／失敗が致命的として返る（BR4.5） |
| `src/catches/store/__tests__/expo-sqlite-driver.test.ts` | 5 | expo-sqlite への呼び出しの対応付け |
| `src/catches/store/__tests__/expo-photo-files.test.ts` | 7 | expo-file-system / expo-image-manipulator への呼び出し（長辺 480px・品質 0.7、アプリ専用領域） |
| `src/catches/store/__tests__/performance.test.ts` | 3 | 500 件での一覧・絞り込み・候補の応答時間（NFR1） |
| `app/__tests__/routes.test.tsx` | 1 | 一覧 → 登録 → 保存 → 一覧 → 詳細 → 削除 → 一覧の通し |

## Coverage Expectations（カバレッジの期待値）

| 対象 | 床 | 実測 |
|------|----|------|
| `src/catches/store/`（保存層） | 行 80% | **98.38%** |
| `src/catches/log/`（ロジック層） | 行 80% | **100%** |
| `src/catches/ui/`・`app/`（画面層） | 床なし（計測のみ） | 95.93% / 92.85% |

床は `jest.config.js` の `coverageThreshold` で強制する。通すために下げない（チームルール）。

## Test Data and Environment（テストデータと環境）

- テストデータは `src/catches/__tests__/fixtures.ts` の `makeCatch` / `makeCatchInput` から作る。魚種・場所は架空（「テストアジ」「テスト釣り場」）、写真は架空のバイト列。友達の実データは使わない（チームルール）
- 各テストでメモリ内 DB と一時ディレクトリを作り直す。テスト間でデータを共有しない
- 時刻と ID は注入して固定する（`FIXED_NOW`、固定 ID）。実時刻・乱数に依存させない
- 外部ネットワークへのアクセスはなし。CI でも追加のサービスは不要

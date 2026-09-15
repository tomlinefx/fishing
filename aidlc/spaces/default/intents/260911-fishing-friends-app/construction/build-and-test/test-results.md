# Test Results — 釣果アプリ（2026-09-12）

## Sources

- 上流資料: `../catches/code-generation/code-generation-plan.md`（code-generation-plan）、`../catches/code-generation/unit-test-instructions.md`（unit-test-instructions）、`../catches/code-generation/code-summary.md`（code-summary）
- 手順書: `build-instructions.md`、`integration-test-instructions.md`、`performance-test-instructions.md`、`security-test-instructions.md`

実行環境: WSL2 / Node v24.16.0 / npm 11.13.0。`adb`・Android SDK・Java なし。ブランチ `bolt-catches`。

## Build Status（ビルド）

| コマンド | 結果 | 出力 |
|----------|------|------|
| `npm ci` | 成功 | ロックファイルどおりに取得 |
| `npm run format:check`（Prettier） | 成功 | 差分なし |
| `npm run lint`（ESLint） | 成功 | 違反 0 |
| `npm run typecheck`（`tsc --noEmit`） | 成功 | 型エラー 0 |
| `npx expo export --platform android` | 成功 | `_expo/static/js/android/entry-ae3795278f393f4b42b8616ee20a8371.hbc`（2.9MB）＋ `metadata.json` |
| **`npm run check`（マージ前ゲート）** | **成功（終了コード 0）** | 下記のテスト結果を含む |

## Test Results（テスト）

実行コマンド: `npm run check`（内部で `jest --coverage`）。この作業単位のコマンド `npx jest --coverage --rootDir . src/catches app` と同じ範囲を1回だけ実行した（重複実行なし）。

```
Test Suites: 16 passed, 16 total
Tests:       128 passed, 128 total
Snapshots:   0 total
Time:        3.544 s
```

| 区分 | 本数 | 結果 |
|------|------|------|
| 合計 | 128 | 全て成功 |
| 失敗 | 0 | — |
| スキップ | 0 | — |

層ごとの内訳: ロジック層 45、保存層 39＋性能 3、画面層 39＋性能 1、画面遷移の通し 1。

### Failure Details

なし（失敗 0 件）。

### Coverage（カバレッジ）

```
All files               |   96.29 |    89.09 |      96 |   96.57 |
 app                    |   88.23 |      100 |   77.77 |   92.85 |
 src/catches            |   16.66 |      100 |       0 |   16.66 |
 src/catches/log        |     100 |     91.3 |     100 |     100 |
 src/catches/store      |   98.41 |    90.24 |     100 |   98.38 |
 src/catches/ui         |   96.06 |    89.44 |     100 |   95.93 |
```

| 対象 | 床 | 実測（行） | 判定 |
|------|----|-----------|------|
| `src/catches/log/`（ロジック層） | 80% | **100%** | 達成 |
| `src/catches/store/`（保存層） | 80% | **98.38%** | 達成 |
| `src/catches/ui/`（画面層） | 床なし | 95.93% | 計測のみ |
| `app/`（画面のルート） | 床なし | 92.85% | 計測のみ |

`src/catches` 直下の 16.66% は `composition.ts`（本番の組み立て。expo の実モジュールを束ねるだけ）による。閾値の対象外。

## Target Verification Matrix（品質目標の検証）

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
|-----------|--------|----------|--------|----------|--------------|---------|
| NFR1-list-1s | requirements.md NFR1 | 一覧の取得が 500 件で 1 秒以内 | 1.0ms | `src/catches/store/__tests__/performance.test.ts`（`[NFR1] 一覧（絞り込みなし・500件）: 1.0ms`） | build-and-test | Met |
| NFR1-filter-1s | requirements.md NFR1 | 絞り込みが 500 件で 1 秒以内 | 0.0ms | 同上（`[NFR1] 絞り込み（魚種＋場所・500件中）: 0.0ms`） | build-and-test | Met |
| NFR1-options-1s | requirements.md NFR1 | 絞り込み候補の算出が 500 件で 1 秒以内 | 0.0ms | 同上（`[NFR1] 絞り込み候補（魚種・500件中）: 0.0ms`） | build-and-test | Met |
| NFR1-render-1s | requirements.md NFR1 | 一覧画面の表示が 500 件で 1 秒以内 | 251.0ms | `src/catches/ui/__tests__/CatchListScreen.performance.test.tsx`（`[NFR1] 一覧画面の表示（500件）: 251.0ms`） | build-and-test | Met |
| NFR1-scroll-60fps | requirements.md NFR1 | 500 件でスクロールに目に見える停止がない | 未計測（自動では測れない） | `performance-test-instructions.md` の「端末での確認」、README の手動チェックリスト | 端末での人の確認（後続工程なし） | Unverified |
| NFR2-android | requirements.md NFR2 | Android のスマホ・縦画面で動作 | `minSdkVersion: 24`、`android.package: jp.fishing.catches` を設定。Android バンドルのエクスポート成功 | `app.json`、`npx expo export --platform android` | build-and-test | Met |
| NFR2-device-run | requirements.md NFR2 | 本人の端末で動く | 未実行（この環境に adb・Android SDK なし） | README の手動チェックリスト | 端末での人の確認（後続工程なし） | Unverified |
| NFR3-durability | requirements.md NFR3 | 削除するまで釣果が失われない（異常終了時も） | ファイル DB を開き直しても残ることをテストで確認 | `src/catches/store/__tests__/catch-repository.test.ts`（永続化の試験） | build-and-test | Met |
| NFR4-offline | requirements.md NFR4 | 最小範囲の機能が通信なしで動作 | 実行時コードにネットワーク呼び出しなし。テストは外部接続なしで全て成功 | `src/catches/store/`（expo-sqlite / file-system のみ）、テスト 128 本 | build-and-test | Met |
| NFR5-coverage-log | team.md Testing Posture | ロジック層 行 80% 以上 | 100% | `jest.config.js` の閾値＋カバレッジ出力 | build-and-test | Met |
| NFR5-coverage-store | team.md Testing Posture | 保存層 行 80% 以上 | 98.38% | 同上 | build-and-test | Met |
| NFR5-methodology | code-generation-plan.md Testing Contract | test-after、ロジック → 保存 → 画面の順 | 実装後にテストを書く順序で作成。層ごとに緑を確認 | `code-summary.md`、コミット履歴（スケルトン → 本体） | code-generation | Met |
| NFR6-secrets | project.md Forbidden | 秘密情報をコミットしない | アプリソースに一致なし。除外設定 7 パターンあり | `security-test-instructions.md` の確認1・2 | build-and-test | Met |
| NFR6-private-storage | requirements.md NFR6 | 他のアプリから直接読めない領域に保存 | `Paths.document` 配下（アプリ専用領域）、DB は expo-sqlite の既定 | `src/catches/store/expo-photo-files.ts` | build-and-test | Met |
| NFR6-deps | team.md Deployment | 修正版のある Critical / High なし | Critical 0、High 0、Moderate 13（ビルド時ツールの依存） | `npm audit --json` | build-and-test | Met |
| NFR7-a11y | requirements.md NFR7 | タップ領域 44px 以上、写真の代替テキスト、見出しとランドマーク | `theme.ts` の `MIN_TAP_SIZE = 44`（＋は 56）、`format.ts` の代替テキスト生成、各画面の見出し | `src/catches/ui/theme.ts`、画面テスト 39 本 | build-and-test | Met |
| NFR8-usability | requirements.md NFR8 | 登録は1画面・必須は写真1枚・3操作以内 | S2 は1画面、必須は写真のみ、「＋ → 写真 → 保存」 | `src/catches/ui/CatchFormScreen.tsx`、`CatchFormScreen.test.tsx`（11本） | build-and-test | Met |
| NFR9-maintainability | requirements.md NFR9 | 画面文言は1か所、画面が保存層を直接呼ばない | 文言は `messages.ts` に集約。画面層から保存層への import なし | `src/catches/messages.ts`、レビューでの確認 | code-generation | Met |

### 判定の内訳

- **Met**: 16 件
- **Unverified**: 2 件（NFR1-scroll-60fps、NFR2-device-run）
- **Not Met**: 0 件

## Failure Analysis（失敗の扱い）

ビルドとテストのコマンドはすべて成功したが、品質目標のうち 2 件が `Unverified` のため、この工程の判定は**失敗**（工程の定義による: 適用対象の目標に `Unverified` があれば失敗）。

### 根本原因

いずれも同じ原因: **この開発機（WSL2）に Android SDK・adb・Java がなく、実機での確認ができない**。生成されたコードや設定の欠陥ではない。

- NFR1-scroll-60fps: スクロールの滑らかさは実機の描画性能に依存し、自動テスト環境（Node + Jest）では測れない
- NFR2-device-run: アプリを端末に載せる操作自体ができない

### この工程での修正の試み（ladder 1: 2回まで）

1. **1回目**: 計測可能な部分を最大限自動化した。NFR1 のうちデータ取得・絞り込み・候補算出・画面描画の4項目を 500 件で実測するテストを追加し、すべて上限の 1/4 以下で達成（最大 251ms / 上限 1000ms）。これにより NFR1 の「1秒以内」の部分は `Met` になったが、スクロールの滑らかさは残った。
2. **2回目**: 環境側の解決を検討した。Android SDK の導入は、この環境（WSL2、Java なし、SDK なし）では数 GB のダウンロードと USB 転送（usbipd）の設定が必要で、この工程の remit（テスト設定・ビルドスクリプト・環境設定）を超える。実機の接続は本人の端末が必要で、エージェントには実行できない。

### 根本原因の分類（ladder 2）

生成されたコードや code-generation で選んだ方式の欠陥では**ない**。差し替え可能な選択肢（ライブラリ・版・イメージ・フラグ）による修正の余地もない。環境と物理的な端末アクセスの制約である。

したがって **code-generation への差し戻し（loop-back）は根本原因に対応しない**。工程の定義に従い、判断を人に委ねる。

### 後続工程の有無

この計画（`fishing-app-greenfield`）では性能検証（performance-validation）と運用フェーズ全体を省いているため、この2つの目標を引き継ぐ後続工程は**ない**。したがって「延期（deferred）」ではなく `Unverified` のまま扱う。

確認は本人のスマホでの作業として `README.md` の手動チェックリストに残してある:

- 初回起動で空の状態が出る
- 釣果を登録できる（写真の許可を含む）
- 一覧が新しい順に並ぶ
- アプリを完全終了して再起動しても残っている
- 機内モードでも動く
- 500 件に近い件数でスクロールが引っかからない
- 写真の代替テキストとタップ領域

## Loop-Back Log

なし（loop-back は発生していない）。

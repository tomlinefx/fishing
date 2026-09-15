# Code Summary — catches（U1、PU-1）

## Sources

- 計画: `code-generation-plan.md`（Step 1〜13、Testing Contract）、`unit-test-instructions.md`
- 設計: `../functional-design/functional-spec.md`、`../functional-design/entities.md`、`../functional-design/rules.md`、`../functional-design/frontend-components.md`
- チームルール: `aidlc/spaces/default/memory/team.md`（トランクベース、ウォーキングスケルトン、test-after、80% の床、配布、コードの書き方）、`aidlc/spaces/default/memory/project.md`（NEVER 秘密情報をコミットしない）

## Overview（何を作ったか）

作業単位 U1 `catches` を React Native + Expo SDK 57（TypeScript strict、expo-router）で実装した。構成は「画面（`src/catches/ui/`、`app/`）→ ロジック（`src/catches/log/`）← 保存（`src/catches/store/`）」の3層で、画面は `CatchLog` だけを呼び、保存層を直接参照するのは組み立ての根 `src/catches/composition.ts` だけである。

ブランチ `bolt-catches` に3つのコミットがある（`main` には初回コミットのみ。squash-merge は Build and Test の承認後）:

1. `0c27651` 初回コミット: ワークフローの記録と設定（`main`）
2. `dc498e7` catches: ウォーキングスケルトン（文字だけで登録→一覧）
3. `69cb0a0` catches: 釣果の登録・一覧・詳細・削除（PU-1）

## Files（作成・変更したファイル）

設定・入口（リポジトリ直下）:

- `package.json`、`package-lock.json` — 依存関係（Expo SDK 57、expo-router／sqlite／file-system／image-manipulator／image-picker／crypto／linking／build-properties）、スクリプト `check`（整形チェック → リント → 型検査 → テスト＋カバレッジ）
- `app.json` — アプリ名「釣果」、`android.package` = `jp.fishing.catches`、`scheme`、config plugins（expo-router、expo-sqlite、expo-image-picker の日本語の許可文言、expo-build-properties の `minSdkVersion: 24`）
- `tsconfig.json` — `expo/tsconfig.base` を継承し strict、`noUncheckedIndexedAccess`、`noImplicitOverride`、`types: ["jest", "react", "node"]`
- `jest.config.js` — preset `jest-expo`、`coverageThreshold` で `./src/catches/log/` と `./src/catches/store/` に `lines: 80`、`coverageReporters: text, lcov`
- `eslint.config.js`（`eslint-config-expo/flat`、テストコードにも Jest グローバル）、`.prettierrc`、`.prettierignore`
- `.gitignore` — 秘密ファイル（`.env`、`.env.*`、`*.pem`、`*.keystore`、`*.jks`、`*.p12`、`google-services.json`）、Expo の雛形の除外項目、`coverage/`
- `README.md` — 前提、`npm run check`、スマホで動かす2つの方法（Expo Go ＋ `npx expo start --tunnel`／`npx expo run:android`）、ロールバック手順、端末での手動チェックリスト、秘密情報の扱い
- `assets/` — Expo の雛形のアイコン（既定のまま）

文言:

- `src/catches/messages.ts` — Error Catalog と画面文言をすべて集約（画面はここからだけ参照）

ロジック層（CatchLog、`src/catches/log/`）:

- `catch.ts` — `Catch`（entities.md のとおり）、`CatchInput`（画面からの文字列入力）、`CatchFilter`、`FilterOptions`
- `validation.ts` — BR1.1〜BR1.4。項目ごとの文言をまとめて返す
- `catch-store-port.ts` — 保存層に求めるインタフェース `CatchStorePort` と `StoreResult`
- `catch-log.ts` — `createCatchLog({ store, clock, idGenerator, logger })`。`saveCatch`（検証 → id・日時付与 → 写真取り込み → 行の保存。行の保存に失敗したら取り込んだ写真を消す）、`listCatches`、`getFilterOptions`、`suggestPlaces`（最大 5 件）、`getCatch`、`deleteCatch`、`prepareStorage`
- `format.ts` — 一覧の日付（`M/D`、当年以外 `YYYY/M/D`）、詳細の日時（`YYYY/M/D H:mm`）、サイズ／重さ、写真の代替テキスト
- `logger.ts` — ロガー型と console 実装

保存層（CatchStore、`src/catches/store/`）:

- `sql-driver.ts` — `exec` / `run` / `all` / `get` / `close` の薄いインタフェース
- `expo-sqlite-driver.ts` — expo-sqlite（`openDatabaseAsync`、`runAsync`、`getAllAsync`、`getFirstAsync`、`execAsync`）による本番実装
- `schema.ts` — `catches` テーブル（`caught_at DESC, id` の索引）、`schema_version` と版上げの枠
- `catch-repository.ts` — `CatchStorePort` の実装。`ORDER BY caught_at DESC, id ASC`、完全一致の AND、`GROUP BY ... ORDER BY MAX(caught_at) DESC` の重複なしの値、削除は行を消してから写真2ファイルを消す（ファイル削除の失敗は警告として記録）
- `photo-files.ts` — 原本のコピー＋縮小版の生成（失敗時は途中のファイルを消す）、`PhotoFileSystem` / `ImageResizer` インタフェース
- `expo-photo-files.ts` — expo-file-system（`Directory` / `File` / `Paths.document`）と expo-image-manipulator（長辺 480px、JPEG 品質 0.7、拡大しない）による本番実装
- `init.ts` — ディレクトリ作成とスキーマ適用。失敗は致命的として返す

画面層（CatchUI、`src/catches/ui/`、`app/`）:

- `AppShell.tsx` — `createLog` を待って `prepareStorage`、致命的エラーなら文言を出して止まる
- `CatchLogContext.tsx` — `CatchLogProvider` / `useCatchLog`
- `CatchListScreen.tsx`（S1）、`CatchFormScreen.tsx`（S2）、`CatchDetailScreen.tsx`（S3）
- 部品: `PhotoPicker.tsx`、`FilterChipBar.tsx`、`CatchCard.tsx`、`EmptyState.tsx`、`NoMatchState.tsx`、`LoadingSkeleton.tsx`、`ErrorBanner.tsx`、`FieldError.tsx`、`LabeledInput.tsx`、`SuggestionList.tsx`、`ConfirmDialog.tsx`、`ScreenHeader.tsx`、`theme.ts`（`MIN_TAP_SIZE = 44`、（＋）は 56）
- `app/_layout.tsx`（AppShell ＋ Stack）、`app/index.tsx`（S1、focus 時に再取得）、`app/new.tsx`（S2）、`app/catch/[id].tsx`（S3）
- `src/catches/composition.ts` — 本番の組み立て（expo-sqlite ドライバ、expo のファイル・縮小実装、`new Date()`、`expo-crypto` の `randomUUID`）

テスト（`__tests__/`）:

- 共通: `src/catches/__tests__/fixtures.ts`（`makeCatch`、`makeCatchInput`、固定時刻）、`fake-catch-store.ts`（メモリ内のフェイク保存層。失敗を差し込める）、`test-catch-log.ts`（本物の CatchLog ＋ フェイク保存層 ＋ 固定の時計・ID）
- ロジック層: `validation.test.ts`（14）、`catch-log.test.ts`（20）、`format.test.ts`（11）
- 保存層: `node-sql-driver.ts`（better-sqlite3 のテスト用ドライバ）、`temp-photo-files.ts`（一時ディレクトリの実ファイル実装とフェイクの縮小器）、`catch-repository.test.ts`（13、永続化＝ファイル DB を開き直す試験を含む）、`photo-files.test.ts`（8）、`init.test.ts`（6）、`expo-sqlite-driver.test.ts`（5、モック）、`expo-photo-files.test.ts`（7、モック）
- 画面層: `AppShell.test.tsx`（4）、`CatchListScreen.test.tsx`（10）、`CatchFormScreen.test.tsx`（11）、`CatchDetailScreen.test.tsx`（8）、`PhotoPicker.test.tsx`（6）、`app/__tests__/routes.test.tsx`（1、expo-router の testing-library で一覧 → 登録 → 一覧 → 詳細 → 削除を通し）

## Key Decisions（主な判断）

- **Result 型で失敗を返す**: 保存層は `StoreResult`（理由＋元の例外）、ロジック層は `LogResult` / `SaveCatchResult`（画面に出す文言）。例外を握りつぶさず、ロガー（既定 console）に記録したうえで呼び出し元に返す。保存領域の初期化失敗だけは致命的として AppShell で fail-fast。
- **写真取り込みの後始末**: 計画では CatchStore の内部としていたが、インタフェースが「写真を取り込む」と「行を保存する」に分かれているため、行の保存に失敗したときの写真ファイルの削除は CatchLog が `removePhotoFiles` を呼んで行う（BR4.3 の「途中で作ったファイルを消す」を満たす）。
- **削除の冪等性**: 存在しない id の削除は成功として扱う（一覧に出ないことが目的、BR3.2）。
- **一覧の読み込み中を「同期 setState」なしで表す**: React Compiler 系のリント（`react-hooks/set-state-in-effect`）に従い、取得要求の鍵と結果の鍵の不一致を「読み込み中」として導出する。`eslint-disable` は使っていない。
- **画面遷移は props で受け取る**: 画面部品は `onSaved` / `onCancel` / `onCatchPress` などを受け取り、`app/` の薄いルートが expo-router に結びつける。画面テストは expo-router に依存しない。
- **戻るの扱い**: Stack のヘッダーは出さず、各画面の `ScreenHeader` の戻るボタンと Android の `BackHandler` の両方で `requestClose`（未保存なら破棄確認）を通す。確認ダイアログは `Modal` ベースの `ConfirmDialog`（テストしやすく、文言を messages に集約できる）。
- **候補（チップ・場所）の二重の守り**: 保存層が `GROUP BY` で重複を除くうえで、CatchLog でも重複・空文字を除く。
- **expo アダプタもテストする**: `expo-sqlite-driver.ts` と `expo-photo-files.ts` は `jest.mock` でモジュールを差し替え、呼び出しの対応付け（`overwrite`、`intermediates`、長辺 480px・品質 0.7、`release()` の呼び出し）を検証する。保存層の閾値対象に含めたまま 98% を維持できた。
- **テストヘルパーはカバレッジから除外**: `collectCoverageFrom` に `!**/__tests__/**` を加え、フェイクやドライバの行で本番コードのカバレッジを水増ししない（unit-test-instructions より厳しい側の調整）。

## Tests and Coverage（テストとカバレッジの結果）

最終の `npm run check`（整形チェック → リント → 型検査 → テスト＋カバレッジ）: **緑**（終了コード 0）。

```
Test Suites: 14 passed, 14 total
Tests:       124 passed, 124 total
```

行カバレッジ（`jest --coverage` の要約行）:

```
All files               |   96.29 |    89.09 |      96 |   96.57 |
 app                    |   88.23 |      100 |   77.77 |   92.85 |
 src/catches            |   16.66 |      100 |       0 |   16.66 |
 src/catches/log        |     100 |     91.3 |     100 |     100 |
 src/catches/store      |   98.41 |    90.24 |     100 |   98.38 |
 src/catches/ui         |   96.06 |    89.44 |     100 |   95.93 |
```

- ロジック層 `src/catches/log/`: 行 100%（床 80% を満たす）
- 保存層 `src/catches/store/`: 行 98.38%（床 80% を満たす）
- 画面層 `src/catches/ui/`: 行 95.93%、`app/`: 行 92.85%（閾値なし、計測のみ）
- `src/catches` の 16.66% は `composition.ts`（本番の組み立て。expo の実モジュールを3つ束ねるだけで、テストなし）による。閾値の対象外。

本数の内訳: ロジック層 45、保存層 39、画面層 39、ルート通し 1 ＝ 124（目安 25〜40 本を上回るのは、expo アダプタのモックテストと画面層の分）。各テストファイルに異常系・境界を2つ以上含む。

## Deviations（計画からの逸脱と環境の制約）

- **`adb` がない**: 開発機（WSL2）に `adb`・Android SDK・Java がないため、Step 1 の端末の Android バージョン確認と Step 9／12 の端末での動作確認はできていない。README に「未確認」と記録し、端末での確認を人の作業（手動チェックリスト）として残した。`npx expo run:android` は実行していない。
- **Step 3 の「空のテスト1本で緑」**: `jest.config.js` の閾値対象ディレクトリ（`src/catches/log/`、`src/catches/store/`）が存在しない時点では Jest が「カバレッジデータなし」で終了コード 1 を返す。閾値は下げず、整形・リント・型検査と一時テストの通過をもって Step 3 を完了とし、Step 5／7 でソースができた時点で `npm run check` が緑になることを確認した。一時テストは Step 6 で削除した。
- **スケルトンの BR1.1 例外**: Step 9 では写真の添付を実装せず、キャッシュ領域に置いた架空の 1x1 JPEG を「添付済み」として `app/new.tsx` から渡した（ロジック層・保存層は変更なし）。Step 10 で `PhotoPicker` に置き換え、`skeleton-placeholder-photo.ts` を削除した。
- **ライブラリの版差**: `@testing-library/react-native` は v14 で `render` / `fireEvent` が非同期になり、`toHaveAccessibilityState` が無い（`toBeSelected` を使用）。`expo-router/testing-library` の `renderRouter` は同期を前提としているため、戻り値（`getPathname` 付き）を保持してから await する形で使った。TypeScript は 6.0 で `@types/*` の自動読み込みが無いため `tsconfig.json` に `types` を明示した。
- **依存の解決**: `react-dom` は jest-expo の要求で入るが、最新 19.3 が `react@19.2.3` と衝突するため `19.2.3` に固定した。`@types/node`、`globals` は間接依存だったものを明示的に devDependencies に加えた。
- **層別のテストコマンド**: `npx jest --coverage --rootDir . src/catches/log` のように一部だけを `--coverage` 付きで走らせると、走らせていない層の閾値が「未達」と出る（Jest の仕様）。README では層別実行は `--coverage` なしで案内し、ゲートは全体の `npm run check`（または `npx jest --coverage --rootDir . src/catches app`）とした。
- **文言の追加**: Error Catalog にない技術的失敗（写真の取得自体の例外）向けに `messages.form.photoPickFailed`（「写真を取得できませんでした。もう一度お試しください」）を1つ追加した。
- **`aidlc/` の記録は未コミット**: アプリのソースだけを `bolt-catches` にコミットした。計画ファイルのチェックや監査ログの変更はワークフロー側の管理に委ねている。

## How to Run（実行方法）

```sh
npm ci
npm run check                                   # 整形チェック → リント → 型検査 → テスト＋カバレッジ
npx jest --coverage --rootDir . src/catches app # この単位のテストだけ
npx expo start --tunnel                         # スマホの Expo Go で動かす（WSL2 は --tunnel）
npx expo run:android                            # Android SDK がある環境で開発ビルドを端末に載せる
```

## Assumptions & Open Questions

- 端末での動作確認（初回起動の空の状態／登録／新しい順／完全終了後の保持／機内モード／許可拒否の案内／代替テキストとタップ領域）は本人のスマホでの作業として README のチェックリストに残した。Expo Go で確認する場合、データは Expo Go のサンドボックスに保存される。[assumption]
- NFR1（500 件で1秒以内）は Build and Test で計測する前提（索引 `caught_at DESC, id` と縮小版 480px で備えている）。[assumption]
- 縮小版の見た目（480px・品質 0.7）と魚種・場所の 50 文字は entities.md の初期値のまま。実機で見て調整してよい。[assumption]

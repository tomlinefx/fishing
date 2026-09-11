# Code Generation Plan — catches

## Sources

- 設計: `../functional-design/functional-spec.md`（WF-1〜WF-4、状態遷移、文言）、`../functional-design/entities.md`（Catch）、`../functional-design/rules.md`（BR1.1〜BR7.2）、`../functional-design/frontend-components.md`（画面部品、テスト用 ID）
- 上流: `../../../inception/units-generation/unit-of-work.md`（U1 catches、kind ui）、`../../../inception/requirements-analysis/requirements.md`（FR1〜FR4、NFR1〜NFR9）、`../../../inception/domain-design/components.md`（CatchUI → CatchLog → CatchStore）、`../../../inception/domain-design/decisions.md`（ADR-001 React Native + Expo、ADR-003 SQLite＋写真、ADR-004 UUID、ADR-005 許可・Android 下限、ADR-006 チップ）
- チームルール: `aidlc/spaces/default/memory/team.md`（トランクベース、ウォーキングスケルトン、test-after、80%、配布、コードの書き方）、`aidlc/spaces/default/memory/project.md`（NEVER 秘密情報をコミットしない）

## Overview（この計画の範囲）

作業単位 U1 `catches` を React Native + Expo（TypeScript）で実装する。1つの作業単位の中で、チームルールどおり最初に**ウォーキングスケルトン**（文字だけで「登録 → 一覧」が通しで動く）を作り、その後に PU-1 本体（写真必須・絞り込み・詳細・削除）を足す。テストは test-after で、層ごと（ロジック → 保存 → 画面）に実装してからその層のテストを書く。

技術スタックの具体値（この計画で確定）:

- Expo SDK の最新安定版、TypeScript strict、画面遷移は expo-router（スタック型）
- 保存: expo-sqlite（釣果1件＝1行）、写真は expo-file-system のアプリ専用領域（`documentDirectory/catches/photos/`、`.../thumbnails/`）、縮小版は expo-image-manipulator（長辺 480px、JPEG 品質 0.7）
- 写真の取得: expo-image-picker（カメラ／ライブラリ、許可の要求と拒否の検知）、設定画面へは expo-linking の `openSettings`
- ID: expo-crypto の `randomUUID`。時計と ID 生成器は CatchLog に注入する
- テスト: jest-expo ＋ @testing-library/react-native。保存層のテストはノード上で動く SQLite ドライバ（`better-sqlite3` を devDependency）を同じインタフェース越しに使う（本番は expo-sqlite）
- 整形・リント: Prettier ＋ ESLint（eslint-config-expo）。型検査は `tsc --noEmit`
- 1コマンドの入口: `npm run check`（整形チェック → リント → 型検査 → テスト＋カバレッジ）
- Android 下限: Expo の既定（`minSdkVersion` 24、Android 7.0 以上）。本人の端末はこれ以上のバージョンのため ADR-005 の「本人の端末のバージョン以上」を満たす。端末の実バージョンは Step 1 で `adb` で確認して README に記録する

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "team",
  "ordering": "ロジック → 保存 → 画面 の順に、層を1つ実装するごとにその層のテストを書いて通し、緑になってから次の層に進む。",
  "scope": "fishing-app-greenfield",
  "test_strategy": "standard",
  "project_type": "greenfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "テストは各 Bolt の成果物の一部として扱います。方法論と順序は次の2項目で明示し、Code Generation はこの2項目をカバレッジ・ツール・スコープ注記とは独立に読み取ります。\n\n- **Methodology**: test-after\n- **Ordering**: ロジック → 保存 → 画面 の順に、層を1つ実装するごとにその層のテストを書いて通し、緑になってから次の層に進む。\n\n層の定義（どのスタックでも同じ3層）:\n\n- **ロジック層** — 釣果1件の入力検証（サイズ・重さが数値か、必須項目が揃っているか）、一覧の並び順（新しい順）、表示の整形。外部依存なし。単体テストで検証します。\n- **保存層** — 釣果を保存する／一覧を読み出す／写真の参照を保持する。メモリ内または一時ディレクトリの実ストアを使った結合テストで検証します（アプリ再起動後も残ることを含む）。\n- **画面層** — S1（空の状態・一覧）、S2（入力エラー文言・保存中・保存後に S1 の先頭へ）、S3（未入力項目を出さない）。スタックの画面コンポーネントテストで検証します。\n\nカバレッジ・量・ゲート:\n\n- **カバレッジの床**: ロジック層と保存層は**行カバレッジ 80% 以上**を必須とします。画面層は計測して結果を残しますが、数値の下限は設けません。この床は Build and Test で確認され、通すために弱めることはできません。\n- **テストの量**: このワークフローの `Test Strategy` は `Standard`（1コンポーネントあたり単体＋結合で 5〜8 本、自動 E2E なし）です。PU-1 のコンポーネントは釣果モデル／検証・保存・S1・S2・S3 の5つ程度なので、目安は 25〜40 本です。スコープごとの床は加算されるだけで、この設定を弱めることはありません。\n- **マージ前ゲート（CI ができるまで）**: ci-pipeline ステージは build-and-test の後に実行されるため、Bolt 1 と PU-1 本体のマージ時には CI がありません。それまでは、リポジトリ直下の1コマンド（整形チェック → リント → ビルド → テスト）を手元で実行して緑になったものだけを `main` に取り込みます（暫定ゲート）。\n- **CI 移行後**: ci-pipeline ステージでは、その同じ1コマンドを CI が呼ぶだけにします。手元と CI で実行内容が同一になり、「手元では通るのに CI で落ちる」を構造的に防ぎます。CI が緑であることがマージ条件になります。\n- **各 Bolt の最低ライン**: テストは正常系に加えて異常系・境界を2つ以上含めます。必ず成功するだけのテスト（実装に関わらず通るもの）は書きません。落ちたテストを再実行して緑にする（retry-to-green）ことで済ませず、原因を直します。\n- **回帰**: 既存のテストは常に緑を保ちます。端末で見つけた不具合は、自動化できるものなら直す前に再現テストを1本書きます。\n- **端末での手動チェックリスト（推奨）**: Standard には自動 E2E がなく、成功条件が「本人のスマホで動く」なので、PU-1 の Bolt 完了時に本人のスマホで次を確認することを推奨します: 初回起動で空の状態が出る／登録できる／一覧が新しい順／アプリを完全終了して再起動しても残っている／写真の代替テキストとタップ領域。電波のない場所（機内モード）での動作確認は固定ルールにはしていませんが、釣り場に電波がない可能性があるため確認項目に加えることを推奨します。\n- **テストデータ**: テストのフィクスチャや画面のサンプルには架空の写真・架空の座標・架空の名前を使うことを推奨します（友達の実データがリポジトリに残るのを防ぐため。固定ルールではありません）。\n- **ツールの種類（スタック中立の要件、domain-design に引き継ぐ）**: (1) テストランナーと、全テスト＋リント＋ビルドを走らせる1コマンドの入口。(2) カバレッジを機械可読の形式（lcov / Cobertura / JSON 等）で出力でき、ディレクトリ単位で閾値を分けられること（層別の床の前提）。(3) 保存層のフェイク（メモリ内または一時ディレクトリの実ストア）。(4) 画面コンポーネントのテストハーネス（スタック標準のもの）。(5) 注入できる時計（登録日時を自動記録する前提のため、時刻を差し替えられないと日付依存のテストになる）。(6) 釣果1件のテストデータ生成ヘルパー。(7) テストコードもリンタ・フォーマッタの対象にする。製品名は domain-design で決めます。"
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:eb376b2c55359cdfa687be333a8245f9378606352b7467ad8ad3bcb44cfe9403",
  "contract_sha256": "sha256:5ad6fd611c7dec291b67d4ee730b645b236499d9ad21e1a4240307c9bcc3416f"
}
```

契約の適用（この計画での読み替え）: 方法論は test-after、順序はロジック → 保存 → 画面。契約の層のうち「API / endpoint」はこの単位に存在しない（通信なし、FR4.3）ため省く。「Data model / database behavior」と「Repository / data access」は保存層（CatchStore）としてまとめ、「Business logic」はロジック層（CatchLog）、「Frontend behavior」は画面層（CatchUI）に対応させる。ただし team.md の順序（ロジック → 保存 → 画面）を優先し、ロジック層を保存層より先に実装する（ロジック層は外部依存がなく、保存層のインタフェースをロジック層が定めるため）。テストランナーは最初の実装ステップより前に整える。

## Steps（実装の手順）

各ステップの末尾に、実装する要件（FR）とルール（BR）を記す。

### 準備

- [ ] **Step 1: リポジトリの準備（Construction 前の準備、team.md）**
  - `.gitignore` に `.env`、`.env.*`、`*.pem`、`*.keystore`、`*.jks`、`*.p12`、`google-services.json` を追加する
  - `aidlc/`、`.claude/`、`.gitignore`、`.mcp.json` を `main` に初回コミットする（コミット文: `初回コミット: ワークフローの記録と設定`）
  - `main` から作業ブランチ `bolt-catches` を切り、以降のステップはこのブランチにコミットする
  - `node -v`（20 以上）、`npm -v`、`adb devices` と `adb shell getprop ro.build.version.release` で本人の端末の Android バージョンを確認し、Step 12 の README に記録する
  - 対応: team.md Way of Working、project.md Forbidden

- [ ] **Step 2: プロジェクトの骨格（Expo + TypeScript）**
  - リポジトリ直下に Expo プロジェクトを作る（`npx create-expo-app@latest . --template blank-typescript` 相当。既存の `aidlc/`、`.claude/` と共存させる）
  - 依存を追加: `expo-router`、`expo-sqlite`、`expo-file-system`、`expo-image-manipulator`、`expo-image-picker`、`expo-crypto`、`expo-linking`、`expo-build-properties`
  - `app.json`: アプリ名「釣果」、`android.package` を `jp.fishing.catches` 相当、`expo-build-properties` で `minSdkVersion` は Expo 既定を明示、カメラ・写真の許可文言（日本語）を設定
  - `tsconfig.json` を strict に。ディレクトリ構成は機能単位: `src/catches/{log,store,ui,messages.ts}`、画面のルートは `app/`（expo-router）
  - ロックファイル（`package-lock.json`）をコミットする
  - 対応: ADR-001、team.md Code Style

- [ ] **Step 3: テストランナーと1コマンドの入口（最初のテストより前に整える）**
  - `jest-expo` ＋ `@testing-library/react-native` ＋ `better-sqlite3`（保存層テスト用）を devDependency に追加
  - `jest.config.js`: preset `jest-expo`、`collectCoverageFrom` を `src/**`、`coverageThreshold` を `./src/catches/log/` と `./src/catches/store/` にそれぞれ `lines: 80`、画面層（`src/catches/ui/`、`app/`）は閾値なしで計測のみ。カバレッジ出力は `text` と `lcov`
  - Prettier（`.prettierrc`）と ESLint（`eslint.config.js`、`eslint-config-expo`、テストコードも対象）
  - `package.json` の scripts: `format:check`、`lint`、`typecheck`（`tsc --noEmit`）、`test`（`jest --coverage`）、`check`（上記を順に実行する1コマンド）
  - この単位のテストだけを走らせる正確なコマンドを `unit-test-instructions.md` に記録する: `npx jest --coverage --rootDir . src/catches app`
  - 空のテスト1本で `npm run check` が緑になることを確認する
  - 対応: team.md Testing Posture（1コマンドの入口、層別の床）、契約の runner_step

### ロジック層（CatchLog）

- [ ] **Step 4: 文言モジュール**
  - `src/catches/messages.ts` に、`functional-spec.md` の Error Catalog と画面の文言（タイトル、ボタン、空の状態、確認ダイアログ）をすべて定数として集める。画面は必ずここから参照する
  - 対応: team.md Code Style（画面文言は1か所）、BR 群の文言

- [ ] **Step 5: ロジック層の実装**
  - `src/catches/log/catch.ts`: `Catch` 型（entities.md のとおり）、`CatchInput` 型（画面からの入力）
  - `src/catches/log/validation.ts`: BR1.1（写真必須）、BR1.2（サイズ: 空か 0 以上・小数1桁）、BR1.3（重さ: 空か 0 以上の整数）、BR1.4（魚種・場所: 前後空白除去、空は未入力、最大 50 文字）。結果は項目ごとの文言を持つ検証結果として返す
  - `src/catches/log/catch-store-port.ts`: 保存層に求めるインタフェース（保存・一覧（並び順・絞り込み）・重複なしの値・1件・削除・写真の取り込み・初期化）
  - `src/catches/log/catch-log.ts`: サービス。注入: `clock`（現在時刻）、`idGenerator`（UUID）、`store`。操作: `saveCatch`（検証 → id と caughtAt 付与 → 写真取り込み → 保存。BR1.5、BR1.6、BR4.3）、`listCatches`（絞り込み条件、BR2.1、BR2.2）、`getFilterOptions`（BR2.3）、`suggestPlaces`（BR6.1、最大 5 件）、`getCatch`、`deleteCatch`（BR3.2 は store に委譲）、`prepareStorage`（BR4.5）。失敗は `Result` 型（成功／検証エラー／保存失敗（理由））で返し、握りつぶさない
  - `src/catches/log/format.ts`: 一覧・詳細の表示整形（日付 `M/D`・当年以外 `YYYY/M/D`、詳細は `YYYY/M/D H:mm`、サイズ／重さの表記、1行省略は画面側）
  - 対応: FR1.2〜FR1.5、FR2.2、FR2.5、FR3.2、FR4.2、BR1.x、BR2.1〜BR2.3、BR6.1

- [ ] **Step 6: ロジック層のテスト（実装後に書く）**
  - `src/catches/log/__tests__/validation.test.ts`: 写真なし／サイズ「abc」／サイズ「25.55」／重さ「120.5」／負の値／魚種 51 文字／前後空白除去／すべて任意が空で通る（8 本以上）
  - `src/catches/log/__tests__/catch-log.test.ts`: フェイクの store と固定の時計・ID で、保存時に id と caughtAt が付く／新しい順／魚種と場所の AND 絞り込み／候補の重複なし・未入力除外／場所候補の最大 5 件と部分一致／保存失敗が理由付きで返る／削除の委譲（7 本以上）
  - `src/catches/log/__tests__/format.test.ts`: 当年・当年以外の日付、サイズ／重さの表記（3 本以上）
  - `npx jest --coverage --rootDir . src/catches/log` が緑で、`src/catches/log/` の行カバレッジ 80% 以上
  - 対応: 契約 strategy_volume、team.md（異常系・境界を2つ以上）

### 保存層（CatchStore）

- [ ] **Step 7: 保存層の実装**
  - `src/catches/store/sql-driver.ts`: SQL 実行の薄いインタフェース（`run`、`all`、`get`）。本番実装 `expo-sqlite-driver.ts`（expo-sqlite）、テスト実装は Step 8 で
  - `src/catches/store/schema.ts`: テーブル `catches`（entities.md の属性、`caught_at` に索引）、`schema_version` テーブルと版上げの枠
  - `src/catches/store/catch-repository.ts`: `catch-store-port.ts` の実装。保存・一覧（`ORDER BY caught_at DESC, id`、魚種／場所の `WHERE` 完全一致）・重複なしの値（`SELECT DISTINCT`、未入力除外、新しい順）・1件・削除（行を消してから写真2ファイルを消す。ファイル削除失敗は記録のみ、BR3.2）
  - `src/catches/store/photo-files.ts`: 写真の取り込み（原本をアプリ専用領域へコピー、縮小版を生成、失敗時は作ったファイルを消す。BR4.3）。ファイル操作と縮小はインタフェース越しにし、テストでは一時ディレクトリの実装に差し替える
  - `src/catches/store/init.ts`: 保存領域の初期化（ディレクトリ作成、スキーマ適用）。失敗は致命的エラーとして返す（BR4.5）
  - 対応: FR4.1〜FR4.3、BR3.2、BR4.3、BR4.4、BR4.5

- [ ] **Step 8: 保存層のテスト（実装後に書く）**
  - `src/catches/store/__tests__/node-sql-driver.ts`: `better-sqlite3` によるテスト用ドライバ（メモリ内 DB）
  - `src/catches/store/__tests__/catch-repository.test.ts`: 保存して読める／新しい順／AND 絞り込み／重複なしの値／1件取得と見つからない／削除で行と2ファイルが消える／ファイル削除失敗でも行は消える／同じ DB を開き直しても残る（永続化）（8 本以上）
  - `src/catches/store/__tests__/photo-files.test.ts`: 一時ディレクトリでコピーと縮小版の生成／縮小失敗で途中ファイルが消える（3 本以上）
  - `src/catches/store/__tests__/init.test.ts`: 初期化成功／失敗が致命的として返る（2 本以上）
  - `npx jest --coverage --rootDir . src/catches/store` が緑で、`src/catches/store/` の行カバレッジ 80% 以上

### 画面層（CatchUI）— ウォーキングスケルトン

- [ ] **Step 9: スケルトン（文字だけで「登録 → 一覧」を通す）**
  - `app/_layout.tsx`（AppShell）: 起動時に `prepareStorage` を呼び、致命的エラーなら文言を表示して止まる（BR4.5）。CatchLog を組み立てて画面に渡す（時計・UUID・expo-sqlite ドライバ・ファイル実装を注入）
  - `app/index.tsx`（S1 の骨格）: 一覧（文字だけのカード）、空の状態、（＋）ボタン、読み込み失敗と再読み込み
  - `app/new.tsx`（S2 の骨格）: 魚種・サイズ・重さ・場所の入力と保存。この段階では写真の添付を実装せず、**一時的に**写真なしでも保存できるようにする（BR1.1 の例外はこのステップ限り。Step 10 で必ず戻す）
  - 端末で「登録 → 一覧の先頭に出る → 再起動しても残る」を確認し、`npm run check` が緑の状態で `bolt-catches` にコミットする（コミット文: `catches: ウォーキングスケルトン（文字だけで登録→一覧）`）
  - 対応: team.md Walking Skeleton の完了条件 (a)(b)(c)

### 画面層（CatchUI）— PU-1 本体

- [ ] **Step 10: 画面層の本実装**
  - `src/catches/ui/PhotoPicker.tsx`: カメラ／ライブラリの選択、許可の要求（操作の直前、BR5.2）、拒否時の案内と「設定を開く」（`Linking.openSettings`、BR5.1）、プレビュー
  - `app/new.tsx`（S2 完成）: 写真必須に戻す（BR1.1）、項目直下の検証文言、保存中の無効化（BR4.2）、保存失敗の上部バナーと入力保持（BR4.1）、未保存で戻るときの破棄確認（BR7.1）、場所の候補表示（`suggestPlaces`、BR6.1）、数字キーボード
  - `app/index.tsx`（S1 完成）: 縮小版の写真カード、未入力の非表示と1行省略（BR7.2）、絞り込みチップ（魚種・場所、AND、解除、BR2.2）、該当なしの文言（BR2.4）、読み込み中のスケルトン
  - `app/catch/[id].tsx`（S3）: 原本の写真、項目（未入力は非表示）、削除の確認と実行、失敗の文言、読み込み失敗と戻る（BR3.1、BR3.2）
  - `src/catches/ui/` の部品: `CatchCard`、`FilterChipBar`、`EmptyState`、`NoMatchState`、`ErrorBanner`、`FieldError`、`SuggestionList`、`ConfirmDialog`
  - すべての操作部品に `frontend-components.md` のテスト用 ID（`testID`）と代替テキスト（`accessibilityLabel`）を付け、タップ領域 44px 以上
  - 対応: FR1.1〜FR1.8、FR2.1〜FR2.8、FR3.1〜FR3.3、NFR7、NFR8、BR5.1、BR5.2、BR7.1、BR7.2

- [ ] **Step 11: 画面層のテスト（実装後に書く）**
  - `src/catches/ui/__tests__/CatchListScreen.test.tsx`: 空の状態／カードが新しい順／チップで絞り込みと解除／該当なし／読み込み失敗と再読み込み／（＋）で登録へ（6 本以上）
  - `src/catches/ui/__tests__/CatchFormScreen.test.tsx`: 写真なしで保存すると文言／サイズ不正の文言／保存中はボタン無効／保存失敗で入力保持／保存成功で一覧へ／破棄確認／場所の候補（7 本以上）
  - `src/catches/ui/__tests__/CatchDetailScreen.test.tsx`: 表示と未入力の非表示／削除の確認でキャンセル／削除の実行で一覧へ／削除失敗の文言（4 本以上）
  - `src/catches/ui/__tests__/PhotoPicker.test.tsx`: 許可拒否で案内と設定導線／許可でプレビュー（2 本以上）
  - CatchLog はフェイク、expo のモジュール（image-picker、linking）は jest のモックで差し替える。画面層は計測のみで閾値なし
  - `npx jest --coverage --rootDir . src/catches app` が緑

### 仕上げ

- [ ] **Step 12: 端末設定・ビルド・手順書**
  - `app.json` の Android 設定を確認（`minSdkVersion`、許可文言、アイコンは Expo 既定で可）
  - `README.md`: 前提（Node、Android 端末、USB デバッグ）、`npm run check`、開発ビルドを本人の Android 端末に載せる手順（`npx expo run:android` 相当）、不具合時に1つ前の緑のコミットへ戻して載せ直す手順、端末の Android バージョンの記録
  - 端末での手動チェックリスト（team.md）を README に載せる: 初回起動で空の状態／登録／新しい順／完全終了して再起動しても残る／機内モードでの動作／写真の代替テキストとタップ領域
  - `npm run check` が緑の状態で `bolt-catches` にコミットする（コミット文: `catches: 釣果の登録・一覧・詳細・削除（PU-1）`）。`main` への squash-merge は Build and Test の承認後に行う
  - 対応: team.md Deployment、ADR-005

- [ ] **Step 13: 文書とトレーサビリティ**
  - `code-summary.md`（作成・変更したファイル、主な判断、テストとカバレッジの結果、計画からの逸脱）
  - `source-manifest.json`（この単位が書いたアプリのソースパスすべて。`app/`、`src/`、設定ファイル、`README.md`、`package.json`、ロックファイル、`.gitignore`）
  - `traceability.json`（FR と BR → 実装ファイル／テストファイル）

## Story-to-Step Traceability（要件と手順の対応）

| 要件 | 手順 |
|------|------|
| FR1（登録）: FR1.1〜FR1.8 | Step 5（検証・自動付与）、Step 7（写真取り込み・保存）、Step 9（骨格）、Step 10（本実装）、Step 6／8／11（テスト） |
| FR2（一覧）: FR2.1〜FR2.8 | Step 5（並び順・絞り込み・候補）、Step 7（クエリ）、Step 9／10（画面）、Step 6／8／11 |
| FR3（詳細・削除）: FR3.1〜FR3.3 | Step 5（削除の委譲）、Step 7（行と写真の削除）、Step 10（S3）、Step 8／11 |
| FR4（データ保持）: FR4.1〜FR4.3 | Step 7（SQLite・ファイル・初期化）、Step 9（AppShell の初期化）、Step 8 |
| NFR1（性能）、NFR2（Android）、NFR3（データ保全）、NFR6（セキュリティ）、NFR7（アクセシビリティ）、NFR8（使いやすさ）、NFR9（保守性） | Step 2／3／7（縮小版・索引・アプリ専用領域）、Step 10（testID・代替テキスト・タップ領域）、Step 12 |
| NFR5（テスト方針） | Step 3、6、8、11 |
| team.md Walking Skeleton | Step 9 |
| team.md Way of Working／Deployment、project.md Forbidden | Step 1、12 |

## Quality Targets（守るべき数値）

- ロジック層（`src/catches/log/`）と保存層（`src/catches/store/`）: 行カバレッジ 80% 以上。閾値は `jest.config.js` に固定し、通すために下げない
- テスト本数の目安: 25〜40 本（Standard）。各テストファイルに異常系・境界を2つ以上
- 一覧: 500 件で1秒以内（NFR1）。Build and Test で 500 件のテストデータを入れて計測する
- 秘密情報をコミットしない（project.md Forbidden）。この単位は外部サービスのキーを使わない

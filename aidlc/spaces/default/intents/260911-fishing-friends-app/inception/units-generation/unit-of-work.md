# Unit of Work — 友達と使う釣りアプリ

## Sources

- 上流資料: `../domain-design/components.md`（components: CatchLog／CatchStore／CatchUI）、`../domain-design/decisions.md`（decisions: ADR-001 React Native + Expo、ADR-002 3部品の一方向依存、ADR-003 SQLite＋写真）、`../requirements-analysis/requirements.md`（requirements: FR1〜FR5、NFR1〜NFR9）
- チームルール: `../practices-discovery/team-practices.md`（最初の Bolt は「文字だけで登録→一覧」の一本通し）
- 本工程の確認済み回答: `units-generation-questions.md` の Q1〜Q2（本文中では `[Q<n>]` で参照）

## Overview（分割の方針）

作業単位は1つ。domain-design の3部品（CatchLog／CatchStore／CatchUI）を1つの作業単位 `catches` にまとめる。[Q1] 次の釣行まで1〜2週間、ひとり開発、配布先は自分のスマホ1台という前提では、単位を分けて「詳細設計 → 実装 → チェック」の往復を増やすより、1単位の中で層の順（ロジック → 保存 → 画面）に作るほうが速い（team-practices の test-after の順序と一致）。ADR-002 の部品境界（画面が保存を直接呼ばない）は、単位を1つにしても部品（モジュール）として保つ。

次の釣行の後の機能（FR5、PU-2〜PU-5、編集）は今回の作業単位に含めない。[Q2] それらは次の取り組み（別のワークフロー）で単位を切る。

## Units（作業単位の一覧）

| Unit ID | Directory | Name | Kind | Complexity | Deployment | Components |
|---------|-----------|------|------|------------|------------|------------|
| U1 | `u1-catches` | catches | ui | M | standalone（React Native + Expo の1アプリを自分の Android 端末へ） | CatchLog, CatchStore, CatchUI |

## U1 — catches（釣果の登録・一覧・詳細・削除）

- **Kind**: `ui` — React Native の画面（S1／S2／S3）を持つ1アプリ。ロジック層と保存層も同じアプリ内のモジュールとして含む。
- **Description**: 次の釣行までの最小範囲（requirements の Must）を実装する。写真必須の釣果を1画面で登録し、新しい順の一覧（魚種・場所のチップで絞り込み）で見て、詳細を開き、確認付きで削除する。データは端末内の SQLite とアプリ専用領域の写真ファイルに保持し、通信なしで動く。
- **Boundaries（含むもの／含まないもの）**:
  - 含む: FR1（登録）、FR2（一覧・絞り込み）、FR3（詳細・削除）、FR4（データ保持・通信不要）、NFR1〜NFR9 のうち最小範囲に関わるもの（性能、Android、データ保全、通信不要、テスト方針、セキュリティ、アクセシビリティ、使いやすさ、保守性）。
  - 含まない: FR5（グループ・タイムライン・クラウド同期・地図・位置共有・編集）、公開・配布の仕組み（scope-document の対象外）。
- **Responsibilities（この単位が納めるもの）**:
  - CatchLog: Catch の型と不変条件、入力検証、UUID と caughtAt の自動付与、並び順、絞り込み条件と候補の算出、結果の成功／失敗への変換
  - CatchStore: SQLite のスキーマと初期化、Catch の保存・一覧・1件取得・削除、写真の取り込み（コピー＋縮小版）と削除
  - CatchUI: S1／S2／S3 の画面と遷移、絞り込みチップ、カメラ・写真・許可の OS 連携（拒否時の案内）、文言モジュール
  - 横断: リポジトリ直下の1コマンド（整形チェック → リント → ビルド → テスト）、フォーマッタ・リンタ設定、ロックファイル、`.gitignore` の整備（team-practices）
- **Deployment model**: standalone。開発ビルドまたはビルド成果物を自分の Android 端末に載せる。載せ方は手順書に残す（team-practices の Deployment）。
- **Complexity**: M — 画面3つ、部品3つ、外部依存は Expo の標準モジュールのみ。技術的な新規性は低いが、カメラ・許可・ファイル・SQLite の OS 連携が一通り入る。
- **Implementation notes and constraints**:
  - 最初の Bolt はウォーキングスケルトン「釣果を1件登録すると一覧に出る（写真なし・文字だけ）」。この間は FR1.2（写真必須）を一時的に満たさず、PU-1 本体の Bolt で満たす（team-practices の Walking Skeleton、requirements の Assumptions）。
  - 層の順（ロジック → 保存 → 画面）で実装し、層ごとにテストを書いて通す。ロジック層と保存層は行カバレッジ 80% 以上（team-practices）。
  - 画面は CatchLog だけを呼ぶ。CatchStore を直接呼ばない（ADR-002）。
  - 時計と UUID 生成は注入可能にし、テストで固定できるようにする（team-practices）。
  - 対応 Android は本人の端末のバージョン以上。Code Generation の前に端末で確認して設定に反映する（ADR-005）。
  - 秘密情報は使わない・コミットしない（project.md Forbidden）。

## Assumptions & Open Questions

- 単位を1つにしたため、Construction の「作業単位ごと」の工程（詳細設計・実装）は1回ずつ回る。ウォーキングスケルトンと PU-1 本体の切り分けは、その1回の実装の中で Bolt として分ける前提。[assumption]
- 次の取り組みで FR5 の単位を切るときは、`u2-groups` のように U2 以降の番号を続ける。[assumption]

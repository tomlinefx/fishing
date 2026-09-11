# Evidence — practices-discovery の根拠と決定の記録

> リード（aidlc-pipeline-deploy-agent）の Step 2 ドラフトの根拠、Step 3 でサポートエージェント3名が独立に調べて結論づけたこと、Step 4 のインタビューで本人が確定した決定、そして残る不確実性を記録します。

## Sources

- `aidlc/spaces/default/intents/260911-fishing-friends-app/aidlc-state.md` — Project Type: Greenfield、Scope: `fishing-app-greenfield`、Depth: Standard、Test Strategy: Standard、Change Control: relaxed、Languages / Frameworks / Build System: Unknown、Operation フェーズ全 SKIP
- `.claude/scopes/aidlc-fishing-app-greenfield.md` — `skeleton: on`、`change_control: relaxed`、ステージ順は code-generation → build-and-test → ci-pipeline
- `aidlc/spaces/default/memory/org.md` — 5節の既定値（提案の出発点）
- `aidlc/spaces/default/memory/team.md` — 5節すべて空（確定済みの内容なし）
- `aidlc/spaces/default/memory/project.md` — 5節すべて空。`## Corrections` に構想段階の学び3件
- 構想段階の成果物: `ideation/intent-capture/intent-statement.md`、`ideation/scope-definition/scope-document.md`、`ideation/scope-definition/intent-backlog.md`、`ideation/rough-mockups/wireframes.md`
- サポートエージェントの独立レビュー: `contributions/aidlc-quality-agent.md`、`contributions/aidlc-developer-agent.md`、`contributions/aidlc-devsecops-agent.md`
- インタビュー: `practices-discovery-questions.md`（Q1〜Q8、`[Answer]:` すべて記入済み、まとめを本人が `Looks correct` で確認）
- ワークスペースの直接確認（下記）

## ワークスペースの走査結果（グリーンフィールドの確認）

リード自身がリポジトリ直下を確認しました。

| 確認したもの | 結果 |
|---|---|
| アプリケーションコード | なし（直下にあるのは `.claude/`、`.git/`、`.gitignore`、`.mcp.json`、`aidlc/` のみ） |
| CI 設定（`.github/`、`.gitlab-ci.yml` など） | なし |
| パッケージ定義（`package.json`、`pyproject.toml`、`go.mod`、`Cargo.toml`、`pubspec.yaml`、`build.gradle` など） | なし |
| テスト | なし |
| git の状態 | ブランチ `main` は存在するがコミットが0件（`git rev-parse HEAD` が失敗）。未追跡: `.claude/`、`.gitignore`、`.mcp.json`、`aidlc/` |

結論: **完全なグリーンフィールド**です。既存の慣習から推論できる証拠はなく、org.md の既定値を提案の出発点にしました。

## ブラウンフィールド上流成果物について

この工程が `consumes` に宣言している `code-structure`、`technology-stack`、`dependencies`、`code-quality-assessment`、`architecture`、`business-overview` はすべて `conditional_on: brownfield` です。本ワークスペースはグリーンフィールドで reverse-engineering は SKIP のため、**これらの成果物は存在しません**。ステージ定義の「グリーンフィールドで存在しない入力はカバレッジ不足に数えない」に該当します。

## リードが推論したこと（Step 2 ドラフトの根拠）

- **Way of Working** — 開発者1人。org.md の既定値（トランクベース、`main` 起点・`main` 合流、squash-merge）はフレームワークの worktree ツールの既定フラグと一致するため、そのまま提案。`main` に初回コミットがない点を Bolt 1 の worktree 作成の前提条件として明記。
- **Walking Skeleton** — `skeleton: on` により Bolt 1 はスケルトン。中身は PU-1 の最小の一本通しと推論。
- **Testing Posture** — org.md の既定 `test-after` を提案。スコープ `fishing-app-greenfield` はカスタムで org.md の「80% 床」の対象一覧にないため自動適用はなし。
- **Deployment** — Operation 全 SKIP・公開は範囲外のため、「配布先＝本人のスマホ1台」と再定義。
- **Code Style** — スタック未定のため、org.md の「プロジェクト設定に委ねる」をスタック中立の言い回しで提案。画面文言が日本語であることは wireframes から確認。

## サポートエージェントが調べて結論づけたこと（Step 3、相互ブラインド）

### aidlc-quality-agent（`contributions/aidlc-quality-agent.md`）

- 調べたもの: リードドラフトの `## Testing Posture`、スコープファイルのステージ順、wireframes の「その他の状態」。
- 結論: (1) `test-after` は妥当。(2) `Ordering` に「ロジック層」が抜けており、ロジック → 保存 → 画面 の3層を明示すべき。(3) カバレッジは「ロジック＋保存に 80%、画面は測るだけ」の層別の床を第3の選択肢として出すべき。(4) ci-pipeline は build-and-test の**後**に来るため Bolt 1 のマージ時に CI が存在しない — CI ができるまでの暫定ゲート（1コマンドをローカル実行して緑）を定義し、CI 移行後は同じコマンドを CI が呼ぶ形にすべき（OBJECT）。(5) Standard 戦略の目安は 25〜40 本、スケルトンは「1層に正常系1本＋端末チェックリスト」を床にする。(6) スタック中立のツール要件7項目（1コマンド入口、ディレクトリ別閾値のカバレッジ、保存層のフェイク、画面テストハーネス、注入できる時計、テストデータ生成ヘルパー、テストコードもリント対象）。(7) 端末での手動チェックリスト（機内モード確認を含む）を推奨。
- 反映: (2)(3)(4)(5)(6) はインタビュー Q3〜Q5 の選択肢と `team-practices.md` の `## Testing Posture` / `## Walking Skeleton` に取り込み。(7) は推奨として記載（機内モード確認は Q8-C で固定ルールに選ばれず）。

### aidlc-developer-agent（`contributions/aidlc-developer-agent.md`）

- 調べたもの: リードドラフトの `## Code Style` と `## Way of Working`、intent-backlog の PU-2〜PU-3（サーバー同期の可能性）。
- 結論: (1) フォーマッタ＋リンタは交渉不可とし Bolt 1 の完了条件に含める。(2) 識別子は英語、コメント・コミット文は日本語でよい、を推奨案として聞く。(3) ドメイン用語の英語対応表を domain-design で1回作る。(4) 画面文言は1か所にまとめる。(5) solo 変種「`main` 直接コミット」の範囲が曖昧 — 許すなら「アプリのコードとテストに触らない変更」に限定すべき（OBJECT）。(6) squash 後のコミットメッセージは `<bolt-slug>: 1行要約`。(7) スタック中立で今 affirm できる原則: 3層のレイヤ境界（画面が保存層を直接呼ばない）、境界でのエラー処理（握りつぶさない、fail-fast の区別）、機能単位のファイル構成（1ファイル 300 行で分割の合図）、リンタが拾わない範囲の命名（OBJECT: ドラフトにこれらが無い）。(8) スタック決定前に決めてはいけないこと（ツールの製品名・設定値、例外か Result 型か、ディレクトリ名、型注釈の厳しさなど）。
- 反映: (1)〜(4)(6)(7) は `team-practices.md` の `## Code Style` / `## Way of Working` / `## Walking Skeleton` に取り込み。(5) は Q1 で B（限定付き直接コミット）が選ばれず A になったため、直接コミットは一切行わない形で決着。(7) のレイヤ境界は Q8-D で固定ルールに選ばれなかったため推奨として記載。(8) はそのまま尊重し、`team-practices.md` では製品名・設定値を決めていない。

### aidlc-devsecops-agent（`contributions/aidlc-devsecops-agent.md`）

- 調べたもの: `.gitignore`（`.env` / `.env.*` と鍵ファイルの無視ルールがない）、`.mcp.json`（API キーは環境変数参照で問題なし）、pre-commit 系設定（なし）、扱うデータの性質（友達の写真・位置情報）。
- 結論: (1) 趣味アプリに釣り合う最小の CI セキュリティゲート: シークレット検出（ブロック）、依存関係の脆弱性監査（修正版がある Critical／High のみブロック）、リンタのセキュリティ系ルールセット、ロックファイルの固定インストール、依存関係の自動更新はセキュリティ更新のみ・月1回。(2) 別立ての SAST サーバ・DAST・コンテナ／IaC スキャン・SBOM は過剰なので入れない。(3) 初回コミットの前に `.gitignore` へ `.env` / `.env.*` / 鍵ファイルを追加すべき（OBJECT）。(4) `main` 直接コミットを許すなら直接コミットにも CI を走らせるべき（OBJECT）。(5) 「CI 緑」の定義にシークレット検出と依存監査を含めるべき（OBJECT）。(6) テストデータには架空の写真・座標・名前を使う。(7) 絶対的な制約の候補2件（秘密情報をコミットしない／友達の実データをテストに使わない）。(8) 後続工程への申し送り: 写真の EXIF（GPS）の扱いは domain-design で明示、ゲートの具体コマンドは ci-pipeline で、スタックの秘密ファイル拡張子は code-generation で `.gitignore` に追加。
- 反映: (1)(2)(3)(5) は `team-practices.md` の `## Deployment` / `## Code Style` / `## Way of Working` に取り込み。(4) は Q1 で直接コミット自体を採用しなかったため不要に。(6) は Q8-B で固定ルールに選ばれず推奨として記載。(7) のうち候補1のみ Q8-A で採用し `discovered-rules.md` の `## Forbidden` に記載。(8) は下記「未解決の不確実性」に引き継ぎ。

## インタビューの決定（Step 4、`practices-discovery-questions.md`）

| 質問 | 領域 | 選択 | 決定の内容 |
|---|---|---|---|
| Q1 | Way of Working | A | トランクベース。Bolt ごとに短命ブランチ `bolt-<slug>` → squash で `main` へ。B（コードとテストに触らない変更は `main` 直接可）は選ばれず、直接コミットの solo 変種は採用しない |
| Q2 | Walking Skeleton | A | ウォーキングスケルトンを最初に作る。「釣果を1件登録すると一覧に出る（写真なし・文字だけ）」 |
| Q3 | Testing Posture | A | test-after。層を1つ実装するごとにその層のテスト。順番はロジック → 保存 → 画面 |
| Q4 | Testing Posture | A | ロジック層と保存層は行カバレッジ 80% 以上必須、画面層は測るだけで下限なし |
| Q5 | Testing Posture / Deployment | A | GitHub などのリモートに置く。CI ができるまでは手元で「整形チェック・ビルド・テスト」を1コマンドで緑にしたものだけ `main` に取り込む（暫定ゲート） |
| Q6 | Deployment | A | 配布先は自分のスマホ1台。`main` が緑（CI、それまでは暫定ゲート）なら載せてよい。載せ方は手順書に残す。不具合時は1つ前の緑の状態に戻す |
| Q7 | Code Style | A | 選んだ道具の標準整形ツール＋リンタ必須、違反は取り込み不可。名前は言語慣習。識別子は英語、コメント・コミット文は日本語可。画面文言は1か所にまとめる |
| Q8 | 固定ルール（複数選択） | A のみ | NEVER 秘密情報（パスワード・API キー等）をリポジトリにコミットしない。B（友達の実データ）、C（機内モード確認）、D（画面→保存層直呼び禁止）は選ばれず、固定ルールにはせず推奨として本文に記載 |

まとめの確認: 本人が `Looks correct` で確認済み。

## 未解決の不確実性（後続工程への申し送り）

- **スタック固有のツール名・設定値** — フォーマッタ／リンタ／テストランナー／カバレッジツール／シークレット検出ツール／監査コマンドの製品名と設定値は domain-design（および ci-pipeline）で決めます。`team-practices.md` はツールの「種類」と要件だけを定めています。
- **CI の具体的なジョブ定義** — 暫定ゲートの1コマンドと同じ内容を CI が呼ぶ、という形だけ決まっており、実行コマンドは ci-pipeline で具体化します。リモートの種類（GitHub など）により、シークレット検出や依存関係更新にホスティング先の組み込み機能を使えるかが変わります。
- **写真の EXIF（GPS 座標）の扱い** — 「場所」の入力に使うのか、保存時に落とすのかは機能要件であると同時に位置情報の扱いの決定です。domain-design で明示します（この工程では決めていません）。
- **固定ルールに採用しなかった推奨** — quality の機内モード確認（Q8-C）、devsecops の架空テストデータ（Q8-B）、developer のレイヤ境界（Q8-D）は本人が固定ルールに選ばなかったため、`team-practices.md` に推奨として残しています。Code Generation はこれらを既定の作法として扱いますが、違反が承認をブロックすることはありません。
- **Bolt 1 後のラダー（残りの Bolt を自律的に続けるか毎回ゲートするか）** — この工程では決めず、Bolt 1 完了時のラダープロンプトで本人が選びます。
- **初回コミットの実施** — `main` にコミットがない状態は現在も続いています（本ファイル更新時点でも `git rev-parse HEAD` は失敗）。Construction 前に `.gitignore` の整備と初回コミットを行うことを `team-practices.md` の `## Way of Working` に準備事項として記載しました。

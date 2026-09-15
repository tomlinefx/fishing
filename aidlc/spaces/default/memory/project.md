# Project-Level Rules

> Project-specific specialisation and corrections. Loaded after `org.md` and
> `team.md` as strict-additive guidance; contradictions with broader policy
> are rejected. Populated by practices-discovery and the self-learning loop.
>
> Use sparingly: most teams don't need a project layer. Reach for it
> only when this specific project needs stable, durable guidance beyond the
> team practice (for example, package-specific release checks or an additional
> regression suite for a legacy component).

## Way of Working

<!-- Project-specific specialisation. Example: -->
<!-- This monorepo requires package-scoped branch names and a package owner -->
<!-- review in addition to the team's normal merge policy. -->

## Walking Skeleton

<!-- Project-specific specialisation. Example: -->
<!-- The walking skeleton must exercise the legacy service adapter as well -->
<!-- as the new service boundary. -->

## Testing Posture

<!-- Project-specific specialisation. -->

## Change Control

<!-- Project-specific. Mode: strict or relaxed. Strict here holds for every intent and cannot be changed from chat. -->

## Deployment

<!-- Project-specific specialisation. -->

## Code Style

<!-- Project-specific specialisation. -->

## Tech Stack

<!-- Technology choices locked for this project. -->

## Decided

<!-- Decisions made in earlier stages that should not be re-asked. -->
<!-- Format: DECIDED: [decision] (Stage [slug], [date]) -->

## Scope Overrides

<!-- Custom scope rules for this project. -->

## Forbidden

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: NEVER [behavior] (affirmed [date]) -->
<!-- Example: NEVER throw exceptions across service layer boundaries (affirmed 2026-05-17) -->

- NEVER パスワードや API キーなどの秘密情報をリポジトリにコミットしない (affirmed 2026-09-11)
## Mandated

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: ALWAYS [behavior] (affirmed [date]) -->
<!-- Example: ALWAYS use Result<T,E> for fallible operations in service layer (affirmed 2026-05-17) -->

## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
- 構想段階（Ideation）の質問では対象プラットフォーム（Web/スマホ）を聞かず、範囲定義以降の工程に回す (learned 2026-09-11) <!-- cid:260911-fishing-friends-app:intent-capture:4bb0834e2975c399b5dca4a081ed5d635ca21fd6abccba0f5253467526034e45 -->
- 期限（次の釣行）は最優先の proto-Unit 1つだけに付け、残りは期限なしで価値順に並べる。全機能に期限を付けると1〜2週間では破綻する (learned 2026-09-11) <!-- cid:260911-fishing-friends-app:scope-definition:799029e9a0238f3f4e25ec1290bded8855088b38d44b5b89caa8ea2414b9fc92 -->
- 画面案は期限のある最小範囲の画面だけを描き、後の機能は入口の置き場所だけを表にする (learned 2026-09-11) <!-- cid:260911-fishing-friends-app:rough-mockups:9a6c5af0d86efab42a1db302943eb4b3185ed90ea681295752dbfb41f2e67ca7 -->
- 専門家の質問のうち、後の設計工程で決まるもの（技術スタック・保存方式など）は除き、今決めないと進め方が固まらないものだけをインタビューで聞く (learned 2026-09-11) <!-- cid:260911-fishing-friends-app:practices-discovery:65ee710badeed2c5b2cde42b7810c84c9ed71639a38e42b0df4f436ab73b2fe6 -->
- 回答から導いた要件（本人が直接選んでいないもの）は、Assumptions にその旨を明記し、固定ルールにはしない (learned 2026-09-11) <!-- cid:260911-fishing-friends-app:requirements-analysis:edfa5c25d925bf1fd12526147a416099402cc3cc96c5820e05bd26efe8b2bc0c -->
- 本人が明示的に選んだときは最小範囲を広げてよいが、作る量の増加は設計・作業分割の工程で見積もる (learned 2026-09-11) <!-- cid:260911-fishing-friends-app:requirements-analysis:1afb9281266bf790555a10370d62f668130ca55dd80284265494be164508c148 -->
- 非機能・インフラの工程を省いた計画では、技術スタックと保存方式を Domain Design で決めて ADR に残す（Code Generation に届くように） (learned 2026-09-11) <!-- cid:260911-fishing-friends-app:domain-design:eb05a67a0798256c8f36726df0cfa3507571e3da19553bd1d2af3a2280c0bb00 -->
- ユーザーストーリーの工程を省いた計画では、作業単位の対応表と traceability は FR を対応づけの単位にする (learned 2026-09-11) <!-- cid:260911-fishing-friends-app:units-generation:d2b16db64f14d12c13f1db8bdb914d1ad04fc217af97cd323932b0c426961750 -->
- 期限が近いひとり開発では作業単位を増やさず1つにし、部品境界はモジュールとして保つ（往復を減らす価値が境界の明確さを上回る） (learned 2026-09-11) <!-- cid:260911-fishing-friends-app:units-generation:e36d7fd4b17f21dd175cfee7eac776b0acba5848ad14857b1c674fc882b6c188 -->
- 受け入れ基準に AC 番号がない計画では、詳細設計の対応表は FR を上流 ID にし対応先を BRx.y にする。画面構成だけの要件は N/A で機能仕様を指す (learned 2026-09-11) <!-- cid:260911-fishing-friends-app:functional-design:425cad6d8af184362d32b724dd86fbdb1e711c0f444d4aa5f9856a679c7663ba -->
- ロジックと保存を含む単位は、種類が ui でも entities.md と rules.md を補助資料として書き、データモデルとルールの源泉を機能仕様から分ける (learned 2026-09-11) <!-- cid:260911-fishing-friends-app:functional-design:afbb2c1d5800822525810a60f875121836e68c2b73b9c69ef2ddce849bcab3ce -->
- 計画承認の安全装置が次の手順の取得コマンドまで止めたときは、その手順の取得を本人に直接（! 付きで）実行してもらって復帰する (learned 2026-09-12) <!-- cid:260911-fishing-friends-app:code-generation:6c3d63e70f0bfc6bef8bdd406526d0d0a13b0f11e115254d7444c20810a54158 -->
- 後続の検証工程（性能検証・運用フェーズ）を省いた計画では、Test Strategy が Standard でも性能とセキュリティの手順書を作って Build and Test で測り切る (learned 2026-09-12) <!-- cid:260911-fishing-friends-app:build-and-test:fddc4171a01f8de43dcebdc2d963270c4dad4ec164535af20af44fb608e3fb1c -->
- CI は手元と同じ1コマンドを呼ぶだけにし、閾値やテストの選び方は設定ファイル側に置いて CI に持たせない（二重管理と手元・CI の不一致を防ぐ） (learned 2026-09-12) <!-- cid:260911-fishing-friends-app:ci-pipeline:b8a42d61c608be553bc07fa90ed6cc5381676a6f48494f2f7df934230f0b086a -->

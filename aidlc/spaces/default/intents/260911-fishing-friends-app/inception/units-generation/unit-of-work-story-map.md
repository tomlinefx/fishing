# Unit of Work Story Map — 友達と使う釣りアプリ

## Sources

- 上流資料: `../requirements-analysis/requirements.md`（requirements: FR1〜FR5。ユーザーストーリーの工程は計画で SKIP のため、FR を対応づけの単位にする）、`../domain-design/components.md`（components）、`../domain-design/decisions.md`（decisions）
- 作業単位の定義: `unit-of-work.md`

## Mapping（要件 → 作業単位）

ユーザーストーリー（`USx.y`）は作られていないため、requirements の機能要件（`FR{n}` / `FR{n}.{m}`）を作業単位に対応づける。

| Requirement | 内容（要約） | Unit ID | Directory | 単位内の実装順（層） |
|-------------|--------------|---------|-----------|----------------------|
| FR1 | 釣果の登録 | U1 | `u1-catches` | 1: ロジック（検証・自動付与）→ 2: 保存 → 3: 画面 S2 |
| FR1.1 | 写真1枚を添付して保存（撮る／選ぶ） | U1 | `u1-catches` | 保存 → 画面 |
| FR1.2 | 写真未添付では保存不可・文言 | U1 | `u1-catches` | ロジック → 画面 |
| FR1.3 | 任意項目（魚種・サイズ・重さ・場所） | U1 | `u1-catches` | ロジック |
| FR1.4 | 数値検証と文言 | U1 | `u1-catches` | ロジック → 画面 |
| FR1.5 | 日時の自動記録・変更不可 | U1 | `u1-catches` | ロジック |
| FR1.6 | 保存失敗時の文言と入力保持 | U1 | `u1-catches` | 画面 |
| FR1.7 | 保存中の二重送信防止 | U1 | `u1-catches` | 画面 |
| FR1.8 | 未保存で戻る確認 | U1 | `u1-catches` | 画面 |
| FR2 | 釣果の一覧 | U1 | `u1-catches` | ロジック → 保存 → 画面 S1 |
| FR2.1 | 起動時の入口 | U1 | `u1-catches` | 画面 |
| FR2.2 | 新しい順 | U1 | `u1-catches` | ロジック → 保存 |
| FR2.3 | カード表示、空の任意項目は非表示 | U1 | `u1-catches` | 画面 |
| FR2.4 | 空の状態 | U1 | `u1-catches` | 画面 |
| FR2.5 | 魚種・場所の絞り込みと解除、該当0件 | U1 | `u1-catches` | ロジック → 保存 → 画面 |
| FR2.6 | 登録・詳細への遷移 | U1 | `u1-catches` | 画面 |
| FR2.7 | 読み込み失敗と再読み込み | U1 | `u1-catches` | 画面 |
| FR2.8 | 長い文字の省略 | U1 | `u1-catches` | 画面 |
| FR3 | 釣果の詳細と削除 | U1 | `u1-catches` | ロジック → 保存 → 画面 S3 |
| FR3.1 | 詳細表示 | U1 | `u1-catches` | 画面 |
| FR3.2 | 確認付き削除 | U1 | `u1-catches` | ロジック → 保存 → 画面 |
| FR3.3 | 編集は最小範囲で提供しない | U1 | `u1-catches` | —（実装なし。FR5.6 で扱う） |
| FR4 | データの保持 | U1 | `u1-catches` | 保存 |
| FR4.1 | 端末内保存・再起動後も残る | U1 | `u1-catches` | 保存 |
| FR4.2 | 自己完結の記録・後でクラウドへ移せる形 | U1 | `u1-catches` | ロジック → 保存 |
| FR4.3 | 通信なしで動作 | U1 | `u1-catches` | 保存 |
| FR5 | 次の釣行の後の機能 | — | — | 今回の単位に含めない（次の取り組み） |
| FR5.1 | グループと招待 | — | — | 後回し |
| FR5.2 | タイムライン | — | — | 後回し |
| FR5.3 | クラウド同期 | — | — | 後回し |
| FR5.4 | ポイントの地図 | — | — | 後回し |
| FR5.5 | 位置共有 | — | — | 後回し |
| FR5.6 | 編集 | — | — | 後回し |

## Cross-cutting（複数の単位にまたがるもの）

- 単位が1つのため、単位をまたぐ要件はない。
- 単位の内部で3層にまたがるもの: FR1（登録）、FR2.5（絞り込み）、FR3.2（削除）、FR4.2（自己完結の記録）。いずれも team-practices の順序（ロジック → 保存 → 画面）で層ごとに作る。

## Coverage Verification（対応の確認）

- Must の要件（FR1〜FR4 とその小項目、計27件）はすべて U1 に割り当てた。FR3.3 は「提供しない」という要件で実装対象がない。
- FR5 系（7件）は今回の単位に含めず、後回し（Deferred）として `traceability.json` に記録した。[Q2]
- U1 には Must の全要件が割り当てられており、要件のない単位はない。

## Assumptions & Open Questions

- None.

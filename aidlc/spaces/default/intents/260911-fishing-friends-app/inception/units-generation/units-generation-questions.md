# Units Generation — 確認したいこと

## Sources

- 上流資料: `../domain-design/components.md`（components: CatchLog／CatchStore／CatchUI）、`../domain-design/decisions.md`（decisions: ADR-001〜006）、`../requirements-analysis/requirements.md`（requirements: FR1〜FR5）
- チームルール: `../practices-discovery/team-practices.md`（最初の Bolt は「文字だけで登録→一覧」の一本通し）
- [scope] Workflow-selected scope: `fishing-app-greenfield`.

決まっていること（再確認はしません）: 部品は3つ（画面→ロジック→保存の一方向）／React Native + Expo の1アプリ／ひとり開発なので並行開発はしない／配布は自分のスマホ1台。

この工程では、設計した部品を「作業単位（Unit）」にどう束ねるかを決めます。作業単位ごとに、この後の詳細設計と実装が1回ずつ回ります。作る順番（どれを先に出すか）はここでは決めません。

---

## Q1. 作業単位はいくつに分けますか？

作業単位の数だけ「詳細設計 → 実装 → チェック」の往復が増えます。次の釣行まで1〜2週間、ひとり開発という前提で選んでください。

- A. 1単位（`catches`）: CatchLog・CatchStore・CatchUI を1つの作業単位にまとめる。往復が1回で済み、最初の一本通し（文字だけで登録→一覧）を同じ単位の中で先に作る（推奨: 期限とひとり開発に最も合う）
- B. 2単位: `catch-core`（CatchLog＋CatchStore。画面のない部品として先に作りテストする）と `catch-app`（CatchUI。core に依存）。チームルールのテスト順（ロジック→保存→画面）と単位が一致するが、往復が2回になる
- C. 3単位（部品ごと）: CatchStore → CatchLog → CatchUI の順に依存。境界が最も明確だが、往復が3回になり期限に対して重い
- D. まだ決めていない
- X. Other (please specify)

[Answer]: A

## Q2. 次の釣行の後の機能（グループ・タイムライン・地図・位置共有・編集）は、今回の作業単位の図に入れますか？

作業単位の図（依存関係）は、この後の実装の繰り返しをそのまま駆動します。図に入れた単位は今回の実装対象になります。

- A. 入れない。今回は最小範囲の単位だけを図にし、後の機能は次の取り組み（別のワークフロー）で単位を切る（推奨: 図に入れると今回の実装対象になってしまうため）
- B. 名前だけ登録して依存関係を示す（今回は実装しないが、図の上で見通しを持たせる）
- C. まだ決めていない
- X. Other (please specify)

[Answer]: A

---

## Consolidated Summary Confirmation

回答のまとめ:

- 作業単位の数: 1単位（`catches`）。CatchLog・CatchStore・CatchUI を1つにまとめ、最初の一本通し（文字だけで登録→一覧）を同じ単位の中で先に作る（Q1: A）
- 後の機能: 今回の作業単位の図には入れない。次の取り組みで単位を切る（Q2: A）

分割計画（この回答から作るもの）:

- 単位: U1 `catches`（ディレクトリ `u1-catches`）、種類 `ui`（React Native の画面を含む1アプリ）、複雑さ M、配布は1アプリとして自分のスマホへ
- 依存関係: 単位が1つなので依存の辺はなし
- 要件の対応: FR1〜FR4（Must）はすべて U1。FR5 は後回し（Deferred）として記録

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

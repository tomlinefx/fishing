# Performance Test Instructions — 釣果アプリ

## Sources

- 上流資料: `../catches/code-generation/code-generation-plan.md`（code-generation-plan の品質目標）、`../catches/code-generation/code-summary.md`（code-summary: 索引と縮小版の備え）、`../catches/code-generation/unit-test-instructions.md`（unit-test-instructions）
- 要件: `../../inception/requirements-analysis/requirements.md` の NFR1

## Target（測る対象）

NFR1: 一覧画面は、開く操作から **1秒以内**にカードが表示され、釣果が **500件**あってもスクロールが引っかからない。

要件が定める判定方法は「500件のテストデータで、一覧表示までの時間を計測して1秒以内」。この工程ではその計測を自動テストとして実行する。スクロールの滑らかさ（1秒間に60回の画面更新）は自動では測れないため、端末での目視確認として残す。

この計画では性能検証（performance-validation）の工程を省いているため、後続の工程にこの目標を引き継ぐ先はない。計測はこの工程で完結させる。

## How to Run（実行方法）

```sh
# データ側（保存層のクエリ）
npx jest --rootDir . src/catches/store/__tests__/performance.test.ts

# 画面側（一覧の表示）
npx jest --rootDir . src/catches/ui/__tests__/CatchListScreen.performance.test.tsx

# 両方（npm run check にも含まれる）
npx jest --rootDir . performance
```

各テストは計測値を `[NFR1] ...` の行として出力する。上限を超えるとテストが失敗する（閾値はテスト内の `LIST_BUDGET_MS` / `RENDER_BUDGET_MS` = 1000ms）。

## Test Design（測り方）

| 測定 | 方法 | 上限 |
|------|------|------|
| 一覧の取得（絞り込みなし） | 500 件を実物の SQLite に入れ、`listCatches({})` の所要時間 | 1000ms |
| 絞り込み（魚種＋場所の AND） | 同じ 500 件に対する条件付き取得 | 1000ms |
| 絞り込み候補の算出 | 同じ 500 件に対する重複なしの値の取得 | 1000ms |
| 一覧画面の表示 | 500 件を返すロジック層で `CatchListScreen` を描画し、最後のカードが出るまでの時間 | 1000ms |

テストデータは 500 件を1分刻みの日時で作り、魚種5種・場所4種を循環させる（絞り込みが実データに近い分布で効くようにするため）。

## Results（実測値、2026-09-12）

実行環境: WSL2 / Node v24.16.0 / Jest（jest-expo）。本人の Android 端末ではない。

| 測定 | 実測 | 上限 | 判定 |
|------|------|------|------|
| 一覧の取得（500件） | **1.0ms** | 1000ms | 達成 |
| 絞り込み（魚種＋場所） | **0.0ms** | 1000ms | 達成 |
| 絞り込み候補の算出 | **0.0ms** | 1000ms | 達成 |
| 一覧画面の表示（500件） | **251.0ms** | 1000ms | 達成 |

データ側が 1ms 台に収まるのは、`caught_at DESC, id ASC` の索引と、一覧が縮小版（長辺 480px）だけを参照する設計による。

## Regression Detection（劣化の検知）

- 上記4つのテストは `npm run check` に含まれるため、劣化すると取り込み前に落ちる
- 上限を緩める変更は行わない（チームルール: 定めた目標は通すために弱めない）
- 件数を増やして確かめたいときは、テスト内の `ROW_COUNT` を一時的に上げて実行する（コミットはしない）

## Remaining Manual Check（端末での確認、人の作業）

自動では測れないため、本人のスマホで次を確認する（README のチェックリストにも記載）:

- 500 件に近い件数を入れた状態で一覧をスクロールし、引っかかりがないこと
- 一覧を開いてからカードが出るまで、待たされる感覚がないこと

実測環境が本人の端末ではないため、端末の性能によっては数値が変わる。上の判定は「設計上のボトルネック（クエリと画像）が上限に対して2桁以上の余裕を持つ」ことの確認であり、端末での体感確認を置き換えるものではない。

# Cross-Unit Traceability — 釣果アプリ

## Sources

- 要件: `../../inception/requirements-analysis/requirements.md`（FR1〜FR5、NFR1〜NFR9）
- 対応表: `../catches/code-generation/traceability.json`（作業単位 `catches`）
- 上流資料: `../catches/code-generation/code-generation-plan.md`（code-generation-plan）、`../catches/code-generation/unit-test-instructions.md`（unit-test-instructions）、`../catches/code-generation/code-summary.md`（code-summary）

ユーザーストーリーの工程は計画で省いているため、`ACx.y.z` は存在しない。要件の `FR` と `NFR` を対応づけの単位にする（project.md の学び）。

## Verdict（判定）

**合格**。要件 ID 42 件すべてが対応表に載っており、`OK` の対応先はすべて実在するファイル。未対応（GAP）・対応先の不在は 0 件。

| 区分 | 件数 |
|------|------|
| 要件 ID（FR＋NFR）合計 | 42 |
| `OK`（実装あり・対応先が実在） | 33 |
| `N/A`（実装しないと要件で定めたもの） | 1 |
| `Deferred`（次の取り組みに送るもの） | 8 |
| `GAP`（未対応） | **0** |
| 対応先のファイルが存在しない | **0** |

## Coverage by Requirement（要件ごとの対応）

作業単位は `catches`（`u1-catches`）の1つのみ。すべての `OK` はこの単位が所有する。

| 要件 | 状態 | 対応先 |
|------|------|--------|
| FR1（釣果の登録） | OK | `src/catches/ui/CatchFormScreen.tsx` |
| FR1.1（写真1枚を添付して保存） | OK | `src/catches/ui/PhotoPicker.tsx` |
| FR1.2（写真なしでは保存不可） | OK | `src/catches/log/validation.ts` |
| FR1.3（任意項目） | OK | `src/catches/ui/CatchFormScreen.tsx` |
| FR1.4（数値検証） | OK | `src/catches/log/validation.ts` |
| FR1.5（日時の自動記録） | OK | `src/catches/log/catch-log.ts` |
| FR1.6（保存失敗時の文言と入力保持） | OK | `src/catches/ui/CatchFormScreen.tsx` |
| FR1.7（二重送信の防止） | OK | `src/catches/ui/CatchFormScreen.tsx` |
| FR1.8（未保存で戻る確認） | OK | `src/catches/ui/CatchFormScreen.tsx` |
| FR2（釣果の一覧） | OK | `src/catches/ui/CatchListScreen.tsx` |
| FR2.1（起動時の入口） | OK | `app/index.tsx` |
| FR2.2（新しい順） | OK | `src/catches/store/catch-repository.ts` |
| FR2.3（カード表示） | OK | `src/catches/ui/CatchCard.tsx` |
| FR2.4（空の状態） | OK | `src/catches/ui/EmptyState.tsx` |
| FR2.5（魚種・場所の絞り込み） | OK | `src/catches/ui/FilterChipBar.tsx` |
| FR2.6（登録・詳細への遷移） | OK | `app/index.tsx` |
| FR2.7（読み込み失敗と再読み込み） | OK | `src/catches/ui/CatchListScreen.tsx` |
| FR2.8（長い文字の省略） | OK | `src/catches/ui/CatchCard.tsx` |
| FR3（詳細と削除） | OK | `src/catches/ui/CatchDetailScreen.tsx` |
| FR3.1（詳細表示） | OK | `src/catches/ui/CatchDetailScreen.tsx` |
| FR3.2（確認付き削除） | OK | `src/catches/ui/CatchDetailScreen.tsx` |
| FR3.3（編集は提供しない） | N/A | 最小範囲では編集を提供しないと要件で定めたもの。FR5.6 で扱う |
| FR4（データの保持） | OK | `src/catches/store/catch-repository.ts` |
| FR4.1（端末内保存・再起動後も残る） | OK | `src/catches/store/schema.ts` |
| FR4.2（自己完結の記録） | OK | `src/catches/log/catch.ts` |
| FR4.3（通信なしで動作） | OK | `src/catches/composition.ts` |
| FR5〜FR5.6（次の釣行の後の機能 7 件） | Deferred | 作業単位の範囲外（`unit-of-work.md` の Boundaries）。次の取り組みで単位を切る |
| NFR1（性能） | OK | `src/catches/store/schema.ts`（索引）。実測は `test-results.md` の検証表 |
| NFR2（Android） | OK | `app.json` |
| NFR3（データ保全） | OK | `src/catches/store/init.ts` |
| NFR4（通信不要） | OK | `src/catches/store/catch-repository.ts` |
| NFR5（テスト方針） | OK | `jest.config.js` |
| NFR6（セキュリティ） | OK | `src/catches/store/expo-photo-files.ts` |
| NFR7（アクセシビリティ） | OK | `src/catches/ui/CatchCard.tsx` |
| NFR8（使いやすさ） | OK | `src/catches/ui/CatchFormScreen.tsx` |
| NFR9（保守性） | OK | `src/catches/messages.ts` |

## Uncovered Elements（未対応の要素）

なし。

`Deferred` の 8 件（FR5 系）は、作業単位の定義（`unit-of-work.md`）で今回の範囲外と明記され、要件（`requirements.md`）でも「次の釣行の後」と位置づけられている。未対応ではなく、範囲外として意図的に送っているもの。

## Notes（承認時に見ておく点）

- `test-results.md` の検証表に `Unverified` が 2 件ある（スクロールの滑らかさ、端末での動作）。これは要件と実装の対応の問題ではなく、この開発機に Android の実行環境がないことによる。対応表としては合格だが、工程全体の判定には影響する

# フェーズ境界の検証 — Ideation → Inception

## 検証日時と対象

- 対象: 構想（Ideation）フェーズの完了と、要件・設計（Inception）フェーズへの引き継ぎ
- 進め方: `fishing-app-greenfield`（構想フェーズで実行したのは intent-capture / scope-definition / rough-mockups の3工程。market-research / feasibility / team-formation / approval-handoff は計画どおり SKIP）

## チェック結果

| 確認項目 | 結果 | 根拠 |
|----------|------|------|
| 目的が捉えられている（Intent captured） | OK | `ideation/intent-capture/intent-statement.md`（承認済み）。中心機能3つ、最優先＝釣果の記録・共有、期限＝次の釣行（1〜2週間以内） |
| 範囲が定義されている（Scope defined） | OK | `ideation/scope-definition/scope-document.md` と `intent-backlog.md`（承認済み）。PU-1 が Must、PU-2〜PU-5 は期限なし |
| 実現性が確認されている（Feasibility confirmed） | 対象外（計画で SKIP） | 標準的なアプリパターンで技術的新規性が低いため、実現性の判断は domain-design に折り込む（計画時の判断）。復活条件: 位置情報のリアルタイム共有が要件に残る場合。scope-definition Q4 で「今いる場所を地図で共有」（PU-5, Could）が選ばれたため、domain-design で実現性を確認すること |
| 取り組みが承認されている（Initiative approved） | OK（scope-definition の承認ゲートで代替） | approval-handoff は計画で SKIP。個人開発のため scope-definition の Approve が同じ役割を果たす |

## 一貫性の確認

- intent-statement の「最優先＝釣果の記録・共有」 → scope-document の最小範囲「釣果の登録と一覧」 → wireframes の3画面（一覧・登録・詳細）: 一貫している。
- intent-statement の「公開は範囲外」 → scope-document の Out of Scope → intent-backlog の Won't: 一貫している。
- 仮置きのまま引き継ぐ事項（要件整理で確認）: 登録時の必須項目／登録日時の自動記録／編集・削除の要否／グループが1つか複数か／一覧の並べ替え・絞り込み。

## 引き継ぎメモ

- Rough Mockups のチェック指摘 R-01（濡れた手での1画面入力）は承認時に「承知のうえで受け入れ」。次の釣行後の見直し候補。
- 次のフェーズで最初に行うのは Practices Discovery（開発の進め方・テスト方針の決定）。

## 判定

- 結果: 通過。未解決の矛盾なし。

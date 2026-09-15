<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-12T16:02:51Z — CI は npm run check を呼ぶだけにし、閾値やテストの選び方を CI 側に持たせなかった; チームルールの「手元と CI で実行内容を同一にする」をそのまま設定に落とした結果、CI の設定ファイルが短くなり、二重管理がなくなった

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-12T16:02:51Z — 秘密情報の検出に gitleaks-action を選び、代替（git grep ベースの簡易走査）を Assumptions に併記した; 非公開リポジトリでライセンスを求められる可能性があるため、切り替え先を先に示しておく方が、後で詰まったときの手戻りが小さい

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

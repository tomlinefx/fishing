<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-11T06:18:48Z — バックログは5つの proto-Unit に分け、期限（次の釣行）を PU-1 だけに付けた; 全機能に期限を付けると1〜2週間では破綻するため、intent-statement の最優先「釣果の記録・共有」の登録・一覧部分だけを Must にし、共有はグループ機能に依存するので Should に落とした

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-11T06:18:48Z — 釣果の記録項目に「日時・天気・潮」が選ばれなかった; 登録日時の自動記録が要るかは要件整理で確認する

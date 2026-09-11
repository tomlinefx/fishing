<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-11T07:15:24Z — 「端末内に保存」という回答から「通信なしで動く」を FR4.3/NFR4 として導出した; 本人が直接選んだ要件ではないため Assumptions にその旨を明記し、固定ルールにはしていない

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-11T07:15:24Z — 最小範囲に削除と絞り込みを追加し、scope-document の「登録と一覧だけ」から広げた; 本人が Q3/Q9 で明示的に選んだため。次の釣行まで1〜2週間の期限に対して作る量が増える点は Domain Design と Units Generation で見積もる

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

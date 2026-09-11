<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-11T07:21:26Z — 工程の定義では技術スタックは NFR・インフラ工程で決めるとされているが、この計画ではその2工程を省いているため、技術スタックと保存方式をこの工程の質問と ADR に含めた; チームルール（team-practices）も「domain-design で言語・フレームワークが決まったら」と定めており、ここで決めないと Code Generation に届かない

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-11T07:36:05Z — 将来の機能（FR5）は部品カタログに含めず「将来の拡張」の表で見通しだけを書いた; 最小範囲の3部品を小さく保ち、Units Generation が期限内の作業だけを分割できるようにするため。traceability では FR5 系を Deferred にした

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-11T07:36:05Z — Expo の各モジュール名（expo-sqlite など）は実装時のバージョンで変わりうる; Code Generation の前に最新の Expo SDK での名称と API を確認する

---
name: fishing-app-greenfield
depth: Standard
keywords: []
description: 友達と使う釣りアプリをゼロから作るための最小構成ワークフロー
skeleton: on
change_control: relaxed
---

# fishing-app-greenfield scope

コンポーザーが「友達と釣りに行きます。釣りアプリを作りたいです。」という記述から合成したカスタムスコープです。
Standard depth で、何を作るかを固める段階(intent-capture、scope-definition、rough-mockups、requirements-analysis)と、
ゼロからの設計と実装・検証(practices-discovery、domain-design、units-generation、functional-design、
code-generation、build-and-test、ci-pipeline)に絞った 14 ステージを実行します。
市場調査・チーム編成・NFR・インフラ・運用フェーズはすべて SKIP です。

Change Control は relaxed です: 承認後に入力が変わった場合、その変更を一度記録して一行で知らせ、承認をやり直さずに先へ進みます。

## Why these stages, why skip those

- 記述が非常に短く、機能・対象プラットフォーム・成功条件が未定のため、意図の曖昧さと暗黙の前提を減らす framing ステージに投資します。
- コードが存在しないグリーンフィールドなので reverse-engineering は不要で、practices-discovery でツールチェーンとテスト方針を、domain-design で構成要素と技術スタックを、functional-design でデータモデルと業務ルールをゼロから決めます。
- units-generation は code-generation が `unit-of-work` を必須入力として要求するため実行します。delivery-planning は units-generation に折り込みます。
- 趣味アプリでリスクが低いため、NFR・インフラ・運用フェーズは SKIP し、公開段階は別インテント(`infra` スコープ相当)で扱います。
- テストも CI も存在しないため、build-and-test に加えて ci-pipeline を最初から実行します。

## Membership

Keyword triggers: なし(`keywords: []`)。`--scope fishing-app-greenfield` で明示指定したときだけ解決されます。
Initialization の 3 ステージと上記 11 ステージが EXECUTE、残り 19 ステージが SKIP です。

# Code Generation — catches — 計画の承認

## Sources

- 計画: `code-generation-plan.md`（13 ステップ、Testing Contract 埋め込み）
- テストの実行方法: `unit-test-instructions.md`
- 設計: `../functional-design/`（functional-spec、entities、rules、frontend-components）

## Plan Approval

`code-generation-plan.md`（埋め込みの Testing Contract を含む）と `unit-test-instructions.md` の内容で実装を始めてよいか、確認します。

要点:

- 最初にウォーキングスケルトン（文字だけで登録 → 一覧）を Step 9 で通し、その後 Step 10〜11 で写真必須・絞り込み・詳細・削除を足す
- test-after で、ロジック → 保存 → 画面の順に、層ごとに実装してからテストを書く。ロジック・保存層は行カバレッジ 80% を `jest.config.js` で強制
- `npm run check`（整形 → リント → 型検査 → テスト）を1コマンドの入口にし、この単位のテストは `npx jest --coverage --rootDir . src/catches app` で実行
- Step 1 で `.gitignore` を強化して初回コミットし、`bolt-catches` ブランチで作業。`main` への取り込みは Build and Test の承認後

[Approval Fingerprint]: sha256:v3:d8a725fdf5ef6c1b3d54b8c58d9351b10545e420bfc0778cea2961ae46442523
[Planned Source]: eec85c5c5c19e5e70f90c4c92881ea485d56fec2bad3f50530714f43ada29d82

- Approve Plan
- Request Changes

[Answer]: Approve Plan

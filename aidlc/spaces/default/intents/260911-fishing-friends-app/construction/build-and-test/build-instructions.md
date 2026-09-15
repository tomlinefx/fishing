# Build Instructions — 釣果アプリ

## Sources

- 上流資料: `../catches/code-generation/code-generation-plan.md`（code-generation-plan）、`../catches/code-generation/unit-test-instructions.md`（unit-test-instructions）、`../catches/code-generation/code-summary.md`（code-summary）
- チームルール: `aidlc/spaces/default/memory/team.md`（1コマンドの入口、マージ前ゲート、ロックファイル）

## Prerequisites（前提）

| 項目 | 必要なもの | 確認コマンド |
|------|------------|--------------|
| Node.js | 20 以上（検証環境は v24.16.0） | `node -v` |
| npm | 10 以上（検証環境は 11.13.0） | `npm -v` |
| ネットワーク | 依存の取得に必要（初回のみ） | — |
| Android SDK / adb | **開発ビルドを端末に載せる場合のみ**。Expo Go を使うなら不要 | `adb version` |

検証環境（WSL2）には `adb`・Android SDK・Java がないため、端末へのインストールは Expo Go 経由で行う。

## Dependency Installation（依存の取得）

```sh
npm ci
```

`package-lock.json` のとおりに取得する（`npm install` ではなく `npm ci`。チームルールの「ロックファイルどおり」）。再現ビルドの前提。

## Environment Setup（環境設定）

環境変数・設定ファイル・ローカルサービスは**不要**。このアプリは通信を行わず（FR4.3）、外部サービスのキーも使わない（NFR6）。`.env` 系のファイルは `.gitignore` で除外済みで、存在しないのが正常。

## Build Commands（ビルド）

| 目的 | コマンド | 結果 |
|------|----------|------|
| 本番相当のバンドル生成 | `npx expo export --platform android` | `dist/` に Hermes バイトコード（約 2.9MB）と `metadata.json` |
| 型検査 | `npm run typecheck`（`tsc --noEmit`） | 型エラーなし |
| 整形チェック | `npm run format:check`（Prettier） | 差分なし |
| リント | `npm run lint`（ESLint、eslint-config-expo） | 違反なし |
| **一括（マージ前ゲート）** | **`npm run check`** | 整形 → リント → 型検査 → テスト＋カバレッジ |

`npm run check` が緑であることが `main` に取り込んでよい条件（チームルールの暫定ゲート。CI 整備後は CI が同じコマンドを呼ぶ）。

## Build Verification（ビルドの確認）

1. `npm run check` の終了コードが 0
2. `npx expo export --platform android` が `Exported: <出力先>` で終わる
3. カバレッジの床（ロジック層・保存層それぞれ行 80%）が `jest.config.js` の閾値で自動的に検証される

## Troubleshooting（よくある詰まり）

| 症状 | 原因と対処 |
|------|------------|
| `npm ci` が peer dependency で失敗 | `react-dom` は 19.2.3 に固定してある。個別に `npm install` して版を動かさない |
| `npm run check` が整形で落ちる | `npx prettier --write .` で整形してから再実行 |
| Jest が「カバレッジデータなし」で落ちる | 層別に `--coverage` を付けて一部だけ走らせたとき。層別実行は `--coverage` なし、ゲートは全体の `npm run check` |
| `npx expo start` で端末がつながらない | WSL2 では `--tunnel` を付ける（`npx expo start --tunnel`） |
| `npx expo run:android` が動かない | Android SDK と Java が必要。Expo Go で動かす場合はこのコマンドを使わない |

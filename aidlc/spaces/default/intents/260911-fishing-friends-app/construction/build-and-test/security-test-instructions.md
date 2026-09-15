# Security Test Instructions — 釣果アプリ

## Sources

- 上流資料: `../catches/code-generation/code-summary.md`（code-summary: 保存先とロックファイル）、`../catches/code-generation/code-generation-plan.md`（code-generation-plan の品質目標）、`../catches/code-generation/unit-test-instructions.md`（unit-test-instructions）
- 要件: `../../inception/requirements-analysis/requirements.md` の NFR6
- ルール: `aidlc/spaces/default/memory/project.md`（NEVER 秘密情報をコミットしない）、`aidlc/spaces/default/memory/team.md`（「緑」の定義＝シークレット検出と依存監査）

## Targets（確認する対象）

| 対象 | 内容 | 出所 |
|------|------|------|
| 秘密情報の非混入 | パスワード・API キー・秘密鍵をリポジトリに含めない | project.md（固定ルール） |
| 保存先の隔離 | 釣果と写真を他のアプリから読めない領域に置く | NFR6 |
| 外部送信なし | 最小範囲では外部サービスへ送信しない | NFR6、FR4.3 |
| 依存の脆弱性 | 修正版がある Critical / High はブロック、それ以外は警告 | team.md Deployment |

公開環境も対象物もないため、DAST・コンテナ／IaC スキャン・別立ての SAST サーバは行わない（practices-discovery の決定）。静的解析はリンタで代替する。

## How to Run（実行方法）

```sh
# 1. 秘密情報の走査（追跡中のアプリソース）
git grep -nIE "(api[_-]?key|apikey|secret|password|passwd|BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|Bearer [A-Za-z0-9._-]{20,})" -- src app '*.json' '*.js' ':!package-lock.json'

# 2. 除外設定の確認（秘密ファイルが追跡対象外か）
grep -nE "env|pem|keystore|jks|p12|google-services" .gitignore

# 3. 依存の脆弱性監査
npm audit
npm audit --json   # 機械可読（severity ごとの件数）

# 4. リント（セキュリティ系ルールを含む静的解析）
npm run lint

# 5. 保存先の確認（アプリ専用領域を使っているか）
grep -rn "Paths\.\|documentDirectory" src/catches/store/
```

## Pass Criteria（合格の基準）

| 確認 | 合格条件 |
|------|----------|
| 1. 秘密情報の走査 | アプリソース（`src/`、`app/`、設定 JSON）に一致なし |
| 2. 除外設定 | `.env`、`.env.*`、`*.pem`、`*.keystore`、`*.jks`、`*.p12`、`google-services.json` が除外されている |
| 3. 依存監査 | 修正版のある Critical / High が 0 件。Moderate 以下は警告として記録 |
| 4. リント | 違反 0 件（`npm run check` に含まれる） |
| 5. 保存先 | 写真は `Paths.document`（アプリ専用領域）、DB は expo-sqlite の既定（アプリ専用領域） |

## Results（実測、2026-09-12）

| 確認 | 結果 | 証跡 |
|------|------|------|
| 1. 秘密情報の走査 | **合格**。アプリソースに一致なし（一致したのは `.claude/` 配下のフレームワーク文書の散文のみで、アプリのコードではない） | 上記コマンド1の出力 |
| 2. 除外設定 | **合格**。7 種の秘密ファイルパターンが `.gitignore` に存在（88〜94 行目） | `.gitignore` |
| 3. 依存監査 | **合格（警告あり）**。Critical 0、High 0、Moderate 13、Low 0。すべて `@expo/config` / `@expo/config-plugins` 系のビルド時ツール依存（`decode-uri-component` の DoS、`uuid` の境界チェック漏れ）。`npm audit fix` の提案は expo 46 への降格（semver major の後退）で、実質的な修正版ではない | `npm audit --json` |
| 4. リント | **合格**。違反 0 | `npm run check` |
| 5. 保存先 | **合格**。`expo-photo-files.ts` が `new Directory(Paths.document, 'catches')` を使用。DB は expo-sqlite の既定でアプリ専用領域 | `src/catches/store/expo-photo-files.ts:6-8` |

Moderate 13 件の扱い: チームルールでは「修正版がある Critical／High はブロック、それ以外は警告」。いずれも開発時のビルドツールの依存で、アプリの実行時コード（Hermes バンドル）には含まれない。Expo SDK の更新で解消される見込みのため、ブロックせず警告として記録し、CI 整備の工程で監査コマンドをパイプラインに組み込む。

## Notes（今回行わないこと）

- 認証・認可は存在しない（利用者は本人のみ、ログインなし）。バイパスの確認対象なし
- 入力の検証は境界（ロジック層）で1回だけ行い、`validation.test.ts` の 14 本が担保する。SQL は常にプレースホルダを使い、文字列連結でクエリを組み立てていない
- 写真の位置情報（EXIF の GPS）は現状そのまま保持する。友達と共有する段階（FR5.3）までに扱いを決める（requirements の Open Questions）

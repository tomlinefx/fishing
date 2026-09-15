# Quality Gates — 釣果アプリ

## Sources

- 上流資料: `../catches/code-generation/code-summary.md`（code-summary: 閾値の設定場所）、`../build-and-test/build-and-test-summary.md`（build-and-test-summary: 品質目標の検証表）、`../build-and-test/test-results.md`（build-test-results: 実測値）
- CI の設定: `ci-config.md`、`.github/workflows/check.yml`
- チームルール: `aidlc/spaces/default/memory/team.md`（カバレッジの床、「緑」の定義、目標を弱めない）、`aidlc/spaces/default/memory/project.md`（NEVER 秘密情報をコミットしない）

## Gate Definition（取り込みの条件）

`main` に取り込んでよいのは、次の**すべて**が緑のとき。

| # | ゲート | 実行するもの | 閾値・条件の置き場所 | 落ちたとき |
|---|--------|--------------|----------------------|------------|
| 1 | 整形 | `prettier --check .` | `.prettierrc`、`.prettierignore` | 取り込み不可 |
| 2 | リント | `eslint .`（eslint-config-expo、テストコードも対象） | `eslint.config.js` | 取り込み不可 |
| 3 | 型検査 | `tsc --noEmit`（strict） | `tsconfig.json` | 取り込み不可 |
| 4 | テスト | `jest --coverage`（128本） | `jest.config.js` | 取り込み不可 |
| 5 | カバレッジの床（ロジック層） | 同上（`coverageThreshold`） | `jest.config.js` の `./src/catches/log/` = 行 80% | 取り込み不可 |
| 6 | カバレッジの床（保存層） | 同上 | `jest.config.js` の `./src/catches/store/` = 行 80% | 取り込み不可 |
| 7 | 性能（500件で1秒以内） | `performance.test.ts`、`CatchListScreen.performance.test.tsx`（テスト4本に内包） | 各テスト内の `LIST_BUDGET_MS` / `RENDER_BUDGET_MS` = 1000 | 取り込み不可 |
| 8 | バンドル生成 | `npx expo export --platform android` | — | 取り込み不可 |
| 9 | 秘密情報の検出 | `gitleaks` | 既定のルールセット | **取り込み不可**（固定ルール） |
| 10 | 依存の脆弱性（重大） | `npm audit --audit-level=high` | Critical / High が 0 件 | 取り込み不可 |
| 11 | 依存の脆弱性（軽微） | `npm audit` | — | 記録のみ（止めない） |

1〜8 は `npm run check` と `npx expo export` として `check` ジョブが、9〜11 は `security` ジョブが実行する。手元でも同じコマンドで再現できる。

## Current Status（現在の値）

`test-results.md` の実測（2026-09-12 時点）:

| ゲート | 基準 | 実測 | 判定 |
|--------|------|------|------|
| カバレッジ（ロジック層） | 行 80% 以上 | 100% | 余裕あり |
| カバレッジ（保存層） | 行 80% 以上 | 98.38% | 余裕あり |
| テスト | 全件成功 | 128 / 128 | 成功 |
| 性能（一覧の取得・500件） | 1000ms 以内 | 1.0ms | 余裕あり |
| 性能（画面の表示・500件） | 1000ms 以内 | 251.0ms | 余裕あり |
| 依存の脆弱性 | Critical / High が 0 | Critical 0、High 0、Moderate 13 | 通過（Moderate は警告） |
| 秘密情報 | 混入なし | 混入なし | 通過 |

参考（床のない計測）: 画面層 95.93%、画面のルート 92.85%。

## Rules（ゲートの扱い方）

1. **閾値は通すために下げない**（チームルール）。カバレッジや性能の上限を緩める変更は行わない。不足したらテストを足すか、実装を直す
2. **落ちたテストを再実行して緑にする（retry-to-green）で済ませない**。原因を直す
3. **既存のテストは常に緑を保つ**。端末で見つけた不具合は、自動化できるなら直す前に再現テストを1本書く
4. **ゲートの追加は歓迎、削除は要検討**。新しい目標（たとえば公開時のストア審査要件）が出たらこの表に足す

## Not Included（今回入れないもの）

| 項目 | 理由 |
|------|------|
| 自動 E2E テスト | Test Strategy が Standard のため範囲外（team.md）。端末での手動チェックリストが代わり |
| DAST・コンテナ／IaC スキャン・別立ての SAST サーバ | 公開環境も対象物もない（practices-discovery の決定）。静的解析はリンタで代替 |
| ビルド成果物の保存 | スマホへは手元から載せるため不要（ci-pipeline Q5） |
| デプロイの自動化 | 公開はこのワークフローの範囲外（scope-document）。別の取り組みで扱う |

## Manual Gate（自動化されていない確認）

自動チェックでは検証できないものが2件ある（`test-results.md` の `Unverified`）。本人のスマホで `README.md` のチェックリストを通す:

- 500 件に近い件数でスクロールが引っかからないこと
- 本人の Android 端末で実際に動くこと（初回起動の空の状態／登録／新しい順／再起動後の保持／機内モード／許可拒否の案内／代替テキストとタップ領域）

この確認は CI では代替できない。次の釣行の前に一度通しておくことを推奨する。

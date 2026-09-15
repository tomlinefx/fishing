# CI Configuration — 釣果アプリ

## Sources

- 上流資料: `../catches/code-generation/code-summary.md`（code-summary: `npm run check` の中身と依存構成）、`../build-and-test/build-and-test-summary.md`（build-and-test-summary: 準備状況と残課題）、`../build-and-test/test-results.md`（build-test-results: 実測値と検証表）
- 手順書: `../build-and-test/build-instructions.md`、`../build-and-test/security-test-instructions.md`
- 本工程の確認済み回答: `ci-pipeline-questions.md` の Q1〜Q5（本文中では `[Q<n>]` で参照）
- チームルール: `aidlc/spaces/default/memory/team.md`（「CI 移行後はその同じ1コマンドを CI が呼ぶだけにする」「緑」の定義）、`aidlc/spaces/default/memory/project.md`（NEVER 秘密情報をコミットしない）

## Overview（この設定の考え方）

チームルールの「手元と CI で実行内容を同一にし、『手元では通るのに CI で落ちる』を構造的に防ぐ」に従い、**CI は `npm run check` を呼ぶだけ**にする。閾値やテストの選び方は `jest.config.js` と `package.json` にあり、CI 側には持たない。

実体は `.github/workflows/check.yml`（GitHub Actions）[Q1]。プルリクエストと `main` への反映後の両方で走る [Q2]。

## Pipeline Stages（実行するもの）

`check` ジョブ（アプリの検証）:

| 順 | 手順 | コマンド | 落ちたら |
|----|------|----------|----------|
| 1 | リポジトリの取得 | `actions/checkout@v4` | 中断 |
| 2 | Node.js 20 の準備（npm のキャッシュ付き） | `actions/setup-node@v4` | 中断 |
| 3 | 依存の取得 | `npm ci`（ロックファイルどおり） | 中断 |
| 4 | **一括チェック** | `npm run check`（整形 → リント → 型検査 → テスト＋カバレッジ） | 中断 |
| 5 | Android バンドルの生成確認 | `npx expo export --platform android` | 中断 |

`security` ジョブ（セキュリティ、`check` と並行）[Q4]:

| 順 | 手順 | コマンド | 落ちたら |
|----|------|----------|----------|
| 1 | リポジトリの取得（履歴込み） | `actions/checkout@v4`（`fetch-depth: 0`） | 中断 |
| 2 | **秘密情報の検出** | `gitleaks/gitleaks-action@v2` | **中断**（固定ルール） |
| 3 | 依存の取得 | `npm ci` | 中断 |
| 4 | **依存の監査（重大）** | `npm audit --audit-level=high` | **中断** |
| 5 | 依存の監査（警告） | `npm audit` | 中断しない（記録のみ） |

同じブランチで新しい実行が始まったら古い実行は止める（`concurrency`）。権限は読み取りのみ（`permissions: contents: read`）。

## Branch Strategy（ブランチの扱い）

チームルールのトランクベース開発に合わせる:

- `main` が唯一の幹。作業は短命ブランチ `bolt-<slug>`（フレームワークが作る）または kebab-case の手動ブランチ
- `main` への取り込みは squash-merge。1つの作業単位が `main` の1コミットになる
- `main` への直接コミットは行わない

## Merge Protection（取り込みの条件）[Q3]

CI が緑でなければ `main` に入れられないようにする。GitHub 側の設定は次の手順で入れる（1回だけ）:

1. GitHub のリポジトリ → Settings → Branches → Add branch protection rule
2. Branch name pattern に `main`
3. **Require a pull request before merging** を有効化（Required approvals は 0 のままでよい。ひとり開発のため）
4. **Require status checks to pass before merging** を有効化し、`整形・リント・型検査・テスト` と `秘密情報の検出・依存の監査` を必須チェックに追加（一度 CI を走らせた後でないと候補に出ない）
5. **Require branches to be up to date before merging** を有効化
6. Save changes

この設定を入れるまでは、チームルールの暫定ゲート（手元で `npm run check` を緑にしてから取り込む）が引き続き有効。

## Artifact Repository（成果物の保存）[Q5]

保存しない。スマホへは手元から `npx expo start --tunnel`（Expo Go）または `npx expo run:android` で載せる。CI では生成の成否だけを確認する。

将来ストアに出す段階（別の取り組み）で、EAS Build と成果物の保存を改めて決める。

## Local Equivalent（手元での同じ実行）

```sh
npm ci
npm run check                              # CI の check ジョブと同じ
npx expo export --platform android         # CI のバンドル生成確認と同じ
npm audit --audit-level=high               # CI の依存監査（重大）と同じ
```

## Assumptions & Open Questions

- 秘密情報の検出に `gitleaks/gitleaks-action@v2` を使う。公開リポジトリなら無料、非公開リポジトリでは組織ライセンスを求められる場合がある。求められたら、代替として `git grep` ベースの簡易走査（`security-test-instructions.md` のコマンド1）をワークフローに直接書く形に切り替える。[assumption]
- Node.js のバージョンは 20（LTS）を CI の基準にする。手元の検証環境は v24 だが、より広いバージョンで通ることを確認する意味で低い側に合わせた。[assumption]
- `npm audit --audit-level=high` は現時点では通る（Critical 0、High 0）。将来 High が出たときに「修正版があるか」の判断は人が行う。[assumption]

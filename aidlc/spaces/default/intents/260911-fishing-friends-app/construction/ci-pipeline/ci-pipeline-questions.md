# CI Pipeline — 確認したいこと

## Sources

- 上流資料: `../catches/code-generation/code-summary.md`（code-summary: `npm run check` と依存構成）、`../build-and-test/build-and-test-summary.md`（build-and-test-summary: 準備状況と残課題）、`../build-and-test/test-results.md`（build-test-results: 実測値と品質目標の検証表）
- チームルール: `aidlc/spaces/default/memory/team.md`（「CI 移行後はその同じ1コマンドを CI が呼ぶだけにする」「緑」の定義＝整形・リント・ビルド・テスト＋シークレット検出＋依存監査、リポジトリはリモートに置く）

決まっていること（再確認はしません）: 1コマンドの入口は `npm run check`／CI は同じコマンドを呼ぶ／ブランチは `main` ＋短命な `bolt-<slug>`／ロックファイルどおりに取得（`npm ci`）／CI が緑であることがマージ条件。

残っているのは「どこで動かすか」と「どこまで厳しくするか」だけです。

---

## Q1. 自動チェック（CI）はどこで動かしますか？

リポジトリの置き場所によって、設定ファイルの形式が決まります。

- A. GitHub（GitHub Actions）— 個人リポジトリなら無料枠で足り、設定ファイル1つで済む
- B. GitLab（GitLab CI）
- C. リモートには置かず、手元のコミット前チェック（git hook）だけにする
- D. まだ決めていない（後で決めるので、設定ファイルは GitHub Actions の形で用意しておく）
- X. Other (please specify)

[Answer]: A

## Q2. 自動チェックはいつ動かしますか？

- A. `main` への取り込み前（プルリクエスト）と、`main` への反映後の両方
- B. プルリクエストのときだけ
- C. すべてのブランチへのコミットのたび
- D. まだ決めていない
- X. Other (please specify)

[Answer]: A

## Q3. 「緑でなければ取り込めない」を強制しますか？

チームルールでは「CI が緑であることがマージ条件」と決めていますが、GitHub 側の設定（ブランチ保護）を実際に入れるかは別の判断です。

- A. 強制する。GitHub のブランチ保護で、チェックが緑でないと `main` に入れられないようにする（手順を手順書に残す）
- B. 強制しない。落ちたら自分で気づいて直す（ひとり開発なので）
- C. まだ決めていない
- X. Other (please specify)

[Answer]: A

## Q4. セキュリティ関連のチェックはどこまで入れますか？

ビルドとテストの工程では、秘密情報の走査と依存監査を手動で実行しました（結果はすべて合格、依存は軽微な警告13件）。これを CI に組み込むかを決めます。

- A. 両方入れる。秘密情報を検出したら止める。依存の脆弱性は Critical/High で止め、それ以外は警告（チームルールどおり）
- B. 秘密情報の検出だけ入れる（依存監査は手動で気が向いたときに）
- C. どちらも入れない
- D. まだ決めていない
- X. Other (please specify)

[Answer]: A

## Q5. 完成したアプリ（ビルド成果物）を CI で保存しますか？

自動チェックのたびに Android 用のバンドルを作って保存しておくと、「この時点の版をスマホに載せたい」というときに取り出せます。

- A. 不要。スマホには手元から `npx expo start` で載せるので、保存する必要はない
- B. 保存する。チェックが緑になったときだけ、バンドルを成果物として残す（数日で自動削除）
- C. まだ決めていない
- X. Other (please specify)

[Answer]: A

---

## Consolidated Summary Confirmation

回答のまとめ:

- CI の場所: GitHub（GitHub Actions）（Q1: A）
- 実行時期: `main` への取り込み前（プルリクエスト）と反映後の両方（Q2: A）
- 強制: ブランチ保護で、チェックが緑でないと `main` に入れられないようにする。手順は手順書に残す（Q3: A）
- セキュリティ: 秘密情報の検出（検出したら止める）と依存監査（Critical/High で止め、それ以外は警告）の両方を入れる（Q4: A）
- ビルド成果物の保存: 不要。スマホには手元から載せる（Q5: A）

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

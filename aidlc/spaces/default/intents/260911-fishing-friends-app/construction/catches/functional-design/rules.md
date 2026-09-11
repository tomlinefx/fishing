# Business Rules — catches（業務ルール）

## Sources

- 上流資料: `../../../inception/requirements-analysis/requirements.md`（requirements: FR1〜FR4、NFR1〜NFR9）、`../../../inception/domain-design/components.md`（components）、`../../../inception/domain-design/decisions.md`（ADR-003〜006）、`../../../inception/units-generation/unit-of-work.md`（unit-of-work: U1）
- 本工程の確認済み回答: `functional-design-questions.md` の Q1〜Q4

補足: 作業単位 U1 は種類 `ui` のため、この資料は工程の必須成果物ではない（units-generation のチェック R-01 で受け入れ済み）。`functional-spec.md` のルール要約はこの資料の YAML から導出する。`traceability.json` の対応先はこの資料の `BRx.y` を使う。

## Rules（機械可読）

```yaml
rules:
  - id: BR1.1
    statement: 写真が添付されていない釣果は保存できない
    category: validation
    applies_to: Catch（登録）
    trigger: 保存の操作
    logic: IF photoPath が空 THEN 保存を拒否し、写真項目の直下に「写真を添付してください」を表示する
    violation: 保存されない。入力内容は保持する
    source: FR1.1, FR1.2
  - id: BR1.2
    statement: サイズは空か、0 以上で小数第1位までの数値でなければならない
    category: validation
    applies_to: Catch.sizeCm
    trigger: 保存の操作
    logic: IF sizeCm が空でなく、数値でない・負・小数第2位以下がある THEN 保存を拒否し、サイズ項目の直下に「サイズは数字で入力してください（小数は1桁まで）」を表示する
    violation: 保存されない。入力内容は保持する
    source: FR1.3, FR1.4
  - id: BR1.3
    statement: 重さは空か、0 以上の整数でなければならない
    category: validation
    applies_to: Catch.weightG
    trigger: 保存の操作
    logic: IF weightG が空でなく、整数でない・負 THEN 保存を拒否し、重さ項目の直下に「重さは整数で入力してください」を表示する
    violation: 保存されない。入力内容は保持する
    source: FR1.3, FR1.4
  - id: BR1.4
    statement: 魚種と場所は前後の空白を除き、空なら未入力として扱う。最大 50 文字
    category: validation
    applies_to: Catch.species, Catch.placeName
    trigger: 保存の操作
    logic: IF 前後の空白を除いた結果が空 THEN 未入力として保存する。IF 50 文字を超える THEN 保存を拒否し、その項目の直下に「50 文字以内で入力してください」を表示する
    violation: 保存されない（文字数超過のとき）。入力内容は保持する
    source: FR1.3
  - id: BR1.5
    statement: 日時は保存した瞬間の端末時刻を自動で記録し、利用者は入力・変更できない
    category: constraint
    applies_to: Catch.caughtAt
    trigger: 保存の操作
    logic: IF 保存が成功する THEN caughtAt に注入された時計の現在時刻を設定する。画面に日時の入力欄を置かない
    violation: 該当なし（利用者の操作では違反できない）
    source: FR1.5
  - id: BR1.6
    statement: 釣果の id は保存時に UUID を自動生成し、以後変更しない
    category: constraint
    applies_to: Catch.id
    trigger: 保存の操作
    logic: IF 新規保存 THEN 注入された ID 生成器で UUID を作り id に設定する
    violation: 該当なし
    source: FR4.2
  - id: BR2.1
    statement: 一覧は日時の新しい順に並べる
    category: policy
    applies_to: 一覧（S1）
    trigger: 一覧の読み出し
    logic: caughtAt の降順で返す。同じ時刻は id の順で安定させる
    violation: 該当なし
    source: FR2.2
  - id: BR2.2
    statement: 魚種と場所の絞り込みは、両方が選ばれていれば両方を満たす釣果だけを返す
    category: policy
    applies_to: 一覧（S1）の絞り込み
    trigger: 絞り込みチップの選択・解除
    logic: IF 魚種が選択 THEN species が完全一致するものに限る。IF 場所が選択 THEN placeName が完全一致するものに限る。両方選択なら AND
    violation: 該当なし
    source: FR2.5
  - id: BR2.3
    statement: 絞り込みチップの候補は、登録済みの魚種・場所を重複なく並べたものとし、未入力は除く
    category: policy
    applies_to: 一覧（S1）の絞り込み候補
    trigger: 一覧の表示・釣果の保存と削除
    logic: species と placeName それぞれの重複なしの値の集合を、出現の新しい順に返す。空（未入力）は含めない
    violation: 該当なし
    source: FR2.5
  - id: BR2.4
    statement: 絞り込みで該当が0件のときは、空の状態とは別の文言を出す
    category: policy
    applies_to: 一覧（S1）
    trigger: 絞り込み結果が0件
    logic: IF 釣果は1件以上あるが絞り込み結果が0件 THEN 「該当する釣果がありません」を表示し、絞り込みの解除を促す。IF 釣果が0件 THEN 空の状態（登録を促す）を表示する
    violation: 該当なし
    source: FR2.4, FR2.5
  - id: BR3.1
    statement: 削除は確認ダイアログで承諾したときだけ実行する。元に戻す機能は持たない
    category: policy
    applies_to: 詳細（S3）の削除
    trigger: 削除の操作
    logic: IF 確認で「削除する」 THEN 削除を実行して一覧へ戻る。IF キャンセル THEN 何もしない
    violation: 該当なし
    source: FR3.2
  - id: BR3.2
    statement: 削除では釣果の行と、写真の原本・縮小版の両ファイルをまとめて消す
    category: constraint
    applies_to: Catch の削除
    trigger: 削除の実行
    logic: 行の削除とファイルの削除を1つの操作として扱い、行の削除が成功してからファイルを消す。ファイル削除の失敗は記録するが利用者への表示は「削除しました」のまま（行がなければ一覧には出ない）
    violation: 該当なし
    source: FR3.2
  - id: BR4.1
    statement: 保存に失敗しても入力内容と添付した写真は失わない
    category: policy
    applies_to: 登録（S2）
    trigger: 保存の失敗
    logic: IF 保存が失敗 THEN 画面上部に「保存できませんでした。もう一度お試しください」を表示し、入力欄と写真プレビューを保持する
    violation: 該当なし
    source: FR1.6
  - id: BR4.2
    statement: 保存中は同じ操作を二重に受け付けない
    category: constraint
    applies_to: 登録（S2）
    trigger: 保存の操作
    logic: IF 保存が進行中 THEN 「保存する」を「保存中...」にして無効化する。完了または失敗で元に戻す
    violation: 該当なし
    source: FR1.7
  - id: BR4.3
    statement: 写真は撮影・選択時にアプリ専用領域へコピーし、縮小版を生成してから保存する
    category: constraint
    applies_to: Catch.photoPath, Catch.thumbnailPath
    trigger: 写真の添付と保存
    logic: 保存の操作で、原本をアプリ専用領域にコピーし、縮小版を生成し、両方のパスを行に書く。いずれかが失敗したら保存全体を失敗として扱い、途中で作ったファイルを消す
    violation: 保存失敗（BR4.1 の扱い）
    source: FR4.1, FR1.1
  - id: BR4.4
    statement: 最小範囲のすべての操作は通信を行わない
    category: constraint
    applies_to: 作業単位 U1 全体
    trigger: 常時
    logic: 登録・一覧・詳細・削除・絞り込み・候補表示のいずれもネットワークを使わない
    violation: 該当なし
    source: FR4.3
  - id: BR4.5
    statement: 保存領域の初期化に失敗したら起動時に致命的エラーとして表示し、操作を進めない
    category: constraint
    applies_to: 起動時
    trigger: アプリ起動
    logic: IF データベースの初期化やアプリ専用領域の作成が失敗 THEN 「保存領域を準備できませんでした。アプリを再起動してください」を表示し、一覧を出さない
    violation: 該当なし
    source: NFR3
  - id: BR4.6
    statement: 一覧の読み込みに失敗したら文言と再読み込みの操作を出す
    category: policy
    applies_to: 一覧（S1）
    trigger: 一覧の読み出しの失敗
    logic: IF 読み出しが失敗 THEN 「釣果を読み込めませんでした」と「再読み込み」を表示する。再読み込みで再度読み出す
    violation: 該当なし
    source: FR2.7
  - id: BR5.1
    statement: カメラ・写真の許可が拒否されたら案内と設定画面への導線を出す。写真なしでの保存は許さない
    category: policy
    applies_to: 登録（S2）の写真の添付
    trigger: 許可の要求で拒否された
    logic: IF 許可が拒否 THEN 写真項目の位置に「写真を添付するには許可が必要です」と「設定を開く」を表示する。BR1.1 は変わらない
    violation: 該当なし
    source: FR1.1, FR1.2
  - id: BR5.2
    statement: 許可は写真ボタンを押した時点で要求し、起動時にまとめて要求しない
    category: policy
    applies_to: 登録（S2）の写真の添付
    trigger: 「カメラで撮る」「写真を選ぶ」の操作
    logic: 操作の直前に必要な許可だけを要求する
    violation: 該当なし
    source: FR1.1
  - id: BR6.1
    statement: 場所の入力中は、過去に入力した場所名を候補として表示し、タップで入力できる
    category: policy
    applies_to: 登録（S2）の場所
    trigger: 場所欄の入力
    logic: 入力文字を含む過去の placeName（重複なし、新しい順）を最大 5 件表示する。入力が空なら新しい順に最大 5 件表示する
    violation: 該当なし
    source: FR1.3
  - id: BR7.1
    statement: 未保存の入力があるときに戻ろうとしたら破棄の確認を出す
    category: policy
    applies_to: 登録（S2）
    trigger: 「戻る」の操作
    logic: IF いずれかの項目に入力または写真がある THEN 「入力を破棄しますか？」を表示し、承諾したときだけ一覧へ戻る
    violation: 該当なし
    source: FR1.8
  - id: BR7.2
    statement: 一覧と詳細では未入力の任意項目を表示せず、一覧では魚種・場所を1行に省略する
    category: policy
    applies_to: 一覧（S1）、詳細（S3）
    trigger: 表示
    logic: IF 項目が未入力 THEN その行を出さない。IF 一覧で1行に収まらない THEN 末尾を省略記号にし、全文は詳細で出す
    violation: 該当なし
    source: FR2.3, FR2.8, FR3.1
```

## Rules Summary（人が読むための要約）

| ID | 分類 | 内容 | 出典 |
|----|------|------|------|
| BR1.1 | 検証 | 写真なしでは保存できない | FR1.1, FR1.2 |
| BR1.2 | 検証 | サイズは 0 以上・小数1桁まで（空可） | FR1.3, FR1.4 |
| BR1.3 | 検証 | 重さは 0 以上の整数（空可） | FR1.3, FR1.4 |
| BR1.4 | 検証 | 魚種・場所は空白除去、空は未入力、最大 50 文字 | FR1.3 |
| BR1.5 | 制約 | 日時は自動記録・変更不可 | FR1.5 |
| BR1.6 | 制約 | id は UUID を自動生成 | FR4.2 |
| BR2.1 | 方針 | 一覧は新しい順 | FR2.2 |
| BR2.2 | 方針 | 魚種と場所の絞り込みは AND | FR2.5 |
| BR2.3 | 方針 | 候補は登録済みの値（重複なし・未入力を除く） | FR2.5 |
| BR2.4 | 方針 | 絞り込み0件と空の状態を区別 | FR2.4, FR2.5 |
| BR3.1 | 方針 | 削除は確認付き、元に戻すなし | FR3.2 |
| BR3.2 | 制約 | 削除は行と写真2ファイルをまとめて | FR3.2 |
| BR4.1 | 方針 | 保存失敗でも入力を保持 | FR1.6 |
| BR4.2 | 制約 | 保存中は二重送信不可 | FR1.7 |
| BR4.3 | 制約 | 写真はコピー＋縮小版を作ってから保存 | FR4.1, FR1.1 |
| BR4.4 | 制約 | 通信を行わない | FR4.3 |
| BR4.5 | 制約 | 保存領域の初期化失敗は致命的エラー | NFR3 |
| BR4.6 | 方針 | 一覧の読み込み失敗は文言＋再読み込み | FR2.7 |
| BR5.1 | 方針 | 許可拒否時は案内＋設定導線、写真なし保存は不可 | FR1.1, FR1.2 |
| BR5.2 | 方針 | 許可は操作の直前に要求 | FR1.1 |
| BR6.1 | 方針 | 場所の候補表示（過去の入力から） | FR1.3 |
| BR7.1 | 方針 | 未保存で戻るときは破棄確認 | FR1.8 |
| BR7.2 | 方針 | 未入力は非表示、一覧は1行省略 | FR2.3, FR2.8, FR3.1 |

## Assumptions & Open Questions

- BR1.4 の 50 文字は設計上の目安（entities.md の Assumptions と同じ）。[assumption]
- BR6.1 の候補件数 5 件は設計上の目安。[assumption]

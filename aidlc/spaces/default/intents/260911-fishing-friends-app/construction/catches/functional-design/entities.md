# Entities — catches（データモデル）

## Sources

- 上流資料: `../../../inception/domain-design/components.md`（components: Catch の持ち主は CatchLog、属性の形）、`../../../inception/requirements-analysis/requirements.md`（requirements: FR1、FR2、FR4）、`../../../inception/units-generation/unit-of-work.md`（unit-of-work: U1）
- 本工程の確認済み回答: `functional-design-questions.md` の Q3（小数の扱い）、Q4（場所の候補）

補足: 作業単位 U1 は種類 `ui` のため、この資料は工程の必須成果物ではない（units-generation のチェック R-01 で受け入れ済み）。データの型と制約を `functional-spec.md` だけに埋め込むと読みにくいため、補助資料として切り出している。`functional-spec.md` の ER 図はこの資料の YAML から導出する。

## Entity Model（機械可読）

```yaml
entities:
  - name: Catch
    description: 釣果1件。写真1枚と任意の項目（魚種・サイズ・重さ・場所）、自動記録の日時を持つ自己完結した記録
    owner: CatchLog
    attributes:
      - name: id
        type: identifier
        required: true
        unique: true
        default: 保存時に UUID を自動生成
        constraints: 保存後に変更不可（ADR-004）
      - name: photoPath
        type: text
        required: true
        constraints: アプリ専用領域内の写真原本のパス。空文字は不可（FR1.1、FR1.2）
      - name: thumbnailPath
        type: text
        required: true
        constraints: アプリ専用領域内の縮小版のパス。原本の取り込み時に必ず生成される（ADR-003）
      - name: species
        type: text
        required: false
        constraints: 前後の空白を除いた文字列。空は「未入力」として保存しない。最大 50 文字
      - name: sizeCm
        type: decimal
        required: false
        min: 0
        constraints: 小数第1位まで。空は「未入力」（Q3）
      - name: weightG
        type: integer
        required: false
        min: 0
        constraints: 整数のみ。空は「未入力」（Q3）
      - name: placeName
        type: text
        required: false
        constraints: 前後の空白を除いた文字列。空は「未入力」。最大 50 文字。絞り込みと候補表示の単位（Q4）
      - name: caughtAt
        type: timestamp
        required: true
        default: 保存した瞬間の端末時刻（注入可能な時計から取得）
        constraints: 保存後に変更不可（FR1.5）
    constraints:
      - photoPath と thumbnailPath は常に対で存在する（片方だけの状態を作らない）
      - 削除時は行と photoPath・thumbnailPath の両ファイルを同時に消す（FR3.2）
    relationships: []
```

## Summary（人が読むための要約）

- エンティティは Catch の1つだけ。他のエンティティへの参照はない（次の釣行の後にグループ・ポイントが加わる見通し）。
- 必須は写真（原本と縮小版のパス）と自動付与の id・caughtAt だけ。魚種・サイズ・重さ・場所は任意で、空のときは「未入力」として保持し、一覧・詳細では表示しない。
- 一覧の並び順は caughtAt の降順。絞り込みと候補表示は species と placeName の完全一致（重複なし）で行う。
- 「後でクラウドへ移せる形」（FR4.2）のため、Catch は外部参照を持たない自己完結の1件として保持する。

## Assumptions & Open Questions

- 魚種・場所の最大 50 文字は設計上の目安であり、要件で決められた値ではない。実装時に画面の折り返しと合わせて調整してよい。[assumption]
- 縮小版の寸法は長辺 480px・JPEG 品質 70% を初期値とする（一覧が 500 件でも軽いことを優先）。実機で見た目を確認して調整してよい。[assumption]

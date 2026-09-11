# Frontend Components — catches（画面部品の構成）

## Sources

- 上流資料: `../../../ideation/rough-mockups/wireframes.md`（S1／S2／S3 の画面案）、`../../../inception/requirements-analysis/requirements.md`（requirements: FR1〜FR3、NFR7、NFR8）、`../../../inception/domain-design/components.md`（components: CatchUI）、`../../../inception/domain-design/decisions.md`（ADR-005 許可、ADR-006 チップ）、`../../../inception/units-generation/unit-of-work.md`（unit-of-work: U1）
- 機能仕様: `functional-spec.md`（WF-1〜WF-4、状態遷移、文言）
- 本工程の確認済み回答: `functional-design-questions.md` の Q1〜Q4

## Component Hierarchy（部品の階層）

```
App
+-- AppShell（起動時の保存領域の初期化、致命的エラー表示、画面遷移の器）
    +-- CatchListScreen（S1）
    |   +-- ScreenHeader（タイトル「釣果」）
    |   +-- FilterChipBar（魚種チップ群、場所チップ群）
    |   |   +-- FilterChip（1つの候補。選択中は強調）
    |   +-- CatchList（縦スクロール）
    |   |   +-- CatchCard（縮小版の写真、魚種、サイズ/重さ、場所、日付）
    |   +-- EmptyState（まだ釣果がありません＋登録ボタン）
    |   +-- NoMatchState（該当する釣果がありません）
    |   +-- LoadingSkeleton（カード形の枠）
    |   +-- ErrorBanner（読み込めませんでした＋再読み込み）
    |   +-- AddCatchButton（右下の＋）
    +-- CatchFormScreen（S2）
    |   +-- ScreenHeader（戻る、タイトル「釣果を登録」）
    |   +-- PhotoPicker（カメラで撮る／写真を選ぶ／プレビュー／許可拒否の案内）
    |   +-- TextField（魚種）
    |   +-- NumberField（サイズ cm）、NumberField（重さ g）
    |   +-- PlaceField（場所。入力中に候補を表示）
    |   |   +-- SuggestionList（過去の場所名、最大 5 件）
    |   +-- FieldError（各項目の直下の文言）
    |   +-- SaveButton（保存する／保存中...）
    |   +-- TopBanner（保存できませんでした）
    |   +-- DiscardConfirmDialog（入力を破棄しますか？）
    +-- CatchDetailScreen（S3）
        +-- ScreenHeader（戻る）
        +-- PhotoView（原本を大きく表示）
        +-- DetailRows（魚種、サイズ/重さ、場所、日時。未入力は出さない）
        +-- DeleteButton
        +-- DeleteConfirmDialog（この釣果を削除しますか？）
        +-- ErrorBanner（表示できませんでした／削除できませんでした）
```

すべての画面文言は1つの文言モジュール（`messages`）から参照する（team-practices）。

## Props / State（各部品が受け取るものと持つ状態）

| Component | 受け取るもの（props） | 持つ状態（state） | 発火する操作 |
|-----------|-----------------------|-------------------|--------------|
| AppShell | — | 初期化中／準備完了／致命的エラー | 初期化の再試行なし（再起動を促す） |
| CatchListScreen | — | 一覧の状態（読み込み中／一覧／空／該当なし／失敗）、絞り込み条件（魚種、場所）、候補 | 一覧取得、候補取得、チップ選択・解除、再読み込み、カードタップ、＋ |
| FilterChipBar | 候補（魚種の配列、場所の配列）、選択中の値 | — | チップのトグル |
| CatchCard | Catch 1件 | — | タップ（詳細へ） |
| CatchFormScreen | — | フォーム状態（空／写真あり／許可なし／保存中／検証エラー／保存失敗／破棄確認）、各項目の値、項目ごとの文言、写真の参照 | 写真添付、入力、候補選択、保存、戻る |
| PhotoPicker | 写真の参照（任意）、許可の状態 | — | 撮る、選ぶ、設定を開く |
| PlaceField | 値、候補 | 候補の表示中か | 入力、候補タップ |
| SaveButton | 保存中か、無効か | — | 保存 |
| CatchDetailScreen | id | 詳細の状態（読み込み中／表示／失敗／削除確認／削除中） | 1件取得、削除確認、削除、戻る |

- 画面は CatchLog の操作だけを呼ぶ（保存・一覧・候補・1件・削除）。CatchStore は参照しない（ADR-002）。
- フォーム状態の遷移は `functional-spec.md` の「登録画面（S2）の状態」に従う。

## Interaction Flows（操作の流れと画面の対応）

| 流れ | 画面と部品 | 仕様の参照 |
|------|------------|------------|
| 登録 | CatchListScreen.AddCatchButton → CatchFormScreen → SaveButton → CatchListScreen（先頭に CatchCard） | WF-1 |
| 写真の許可拒否 | PhotoPicker（案内＋設定を開く） | WF-1 手順2、BR5.1 |
| 絞り込み | FilterChipBar → CatchList（AND）／NoMatchState | WF-2 手順5〜6、BR2.2、BR2.4 |
| 詳細と削除 | CatchCard → CatchDetailScreen → DeleteConfirmDialog → CatchListScreen | WF-3 |
| 起動失敗 | AppShell（致命的エラー） | WF-4、BR4.5 |

## Form Validation（入力の検証と表示）

| 項目 | 検証（CatchLog が行う） | 画面での表示 |
|------|-------------------------|--------------|
| 写真 | 必須（BR1.1） | PhotoPicker の直下に FieldError |
| 魚種 | 空白除去、最大 50 文字（BR1.4） | TextField の直下に FieldError |
| サイズ | 空か 0 以上・小数1桁（BR1.2） | 数字キーボード（小数可）、NumberField の直下に FieldError |
| 重さ | 空か 0 以上の整数（BR1.3） | 数字キーボード（整数）、NumberField の直下に FieldError |
| 場所 | 空白除去、最大 50 文字（BR1.4） | PlaceField の直下に FieldError |

- 検証は保存時に CatchLog が1回だけ行う。画面は入力中に検証しない（数字キーボードの制限のみ）。
- 検証エラーの文言は `functional-spec.md` の Error Catalog を使う。

## Accessibility（NFR7）

- タップ領域は 44px 以上（AddCatchButton は 56px）。
- CatchCard と PhotoView の写真には「{魚種} {サイズ}cm {場所} の写真」の代替テキストを付ける（未入力の項目は省く）。
- 各画面に h1 相当の見出し（釣果／釣果を登録／魚種名）と header／main のランドマークを持つ。
- 各入力欄にはラベルを上に表示する（プレースホルダーだけにしない）。
- 主要な操作部品には安定した識別子（テスト用 ID）を付ける: `catch-list-add-button`、`catch-form-photo-camera`、`catch-form-photo-library`、`catch-form-species`、`catch-form-size`、`catch-form-weight`、`catch-form-place`、`catch-form-save`、`catch-list-card-{id}`、`catch-detail-delete`、`filter-chip-species-{value}`、`filter-chip-place-{value}`。

## Assumptions & Open Questions

- 画面遷移はスタック型（一覧 → 登録／詳細 → 戻る）を前提とする。タブは持たない。[assumption]
- チップ群が横に収まらない場合は横スクロールにする。[assumption]

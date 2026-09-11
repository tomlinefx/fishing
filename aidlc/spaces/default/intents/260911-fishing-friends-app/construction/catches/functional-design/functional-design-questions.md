# Functional Design — catches — 確認したいこと

## Sources

- 上流資料: `../../../inception/units-generation/unit-of-work.md`（unit-of-work: U1 catches）、`../../../inception/units-generation/unit-of-work-story-map.md`（unit-of-work-story-map）、`../../../inception/requirements-analysis/requirements.md`（requirements: FR1〜FR4、NFR1〜NFR9）、`../../../inception/domain-design/components.md`（components: CatchLog／CatchStore／CatchUI）、`../../../inception/domain-design/decisions.md`（ADR-001〜006）、`../../../ideation/rough-mockups/wireframes.md`
- [scope] Workflow-selected scope: `fishing-app-greenfield`.

決まっていること（再確認はしません）: 写真必須・他は任意／日時は自動記録・変更不可／削除は確認付き／絞り込みは上部のチップ（魚種・場所）／SQLite＋写真は原本と縮小版／UUID／許可拒否時は案内と設定導線／Android。

実装前の詳細設計で、残っている細かい挙動だけを確認します。

---

## Q1. 絞り込みチップで「魚種」と「場所」を同時に選んだとき、どう絞りますか？

- A. 両方の条件を満たす釣果だけを表示する（魚種「アジ」かつ場所「本牧」）
- B. 同時には選べない。一方を選ぶともう一方は解除される
- C. まだ決めていない
- X. Other (please specify)

[Answer]: A

## Q2. 削除したあとの「元に戻す」は必要ですか？

- A. 不要。削除前の確認ダイアログだけでよい
- B. 削除後に数秒間「元に戻す」を表示し、押せば復元する（確認ダイアログは出さない）
- C. 確認ダイアログも「元に戻す」も両方
- D. まだ決めていない
- X. Other (please specify)

[Answer]: A

## Q3. サイズ（cm）と重さ（g）に小数は入れられますか？

- A. サイズは小数1桁まで（25.5 cm）、重さは整数のみ（120 g）
- B. どちらも整数のみ
- C. どちらも小数1桁まで
- D. まだ決めていない
- X. Other (please specify)

[Answer]: A

## Q4. 「場所」の入力に、過去に入力した場所名の候補を出しますか？

画面案では文字入力のみですが、同じ釣り場を繰り返し入力する場合に表記の揺れを減らせます（絞り込みチップの候補にも効きます）。

- A. 出す。入力中に過去の場所名を候補として表示し、タップで入力できる
- B. 出さない。文字入力のみ（画面案のとおり）
- C. まだ決めていない
- X. Other (please specify)

[Answer]: A

---

## Consolidated Summary Confirmation

回答のまとめ:

- 絞り込みの同時選択: 魚種と場所を同時に選んだときは、両方の条件を満たす釣果だけを表示する（Q1: A）
- 削除の取り消し: 不要。削除前の確認ダイアログだけ（Q2: A）
- 小数: サイズは小数1桁まで（25.5 cm）、重さは整数のみ（120 g）（Q3: A）
- 場所の候補: 入力中に過去の場所名を候補表示し、タップで入力できる（Q4: A）

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

# Build and Test Summary — 釣果アプリ（2026-09-12）

## Sources

- 上流資料: `../catches/code-generation/code-generation-plan.md`（code-generation-plan の Testing Contract と品質目標）、`../catches/code-generation/unit-test-instructions.md`（unit-test-instructions）、`../catches/code-generation/code-summary.md`（code-summary）
- 要件: `../../inception/requirements-analysis/requirements.md`、チームルール: `aidlc/spaces/default/memory/team.md`
- この工程の成果物: `build-instructions.md`、`integration-test-instructions.md`、`performance-test-instructions.md`、`security-test-instructions.md`、`test-results.md`、`cross-unit-traceability.md`

## Overall Status（全体の状況）

| 項目 | 結果 |
|------|------|
| ビルド | 成功（`npm run check` 終了コード 0、Android バンドルのエクスポート成功） |
| テスト | 128 本すべて成功（16 ファイル、失敗 0、スキップ 0） |
| カバレッジの床 | ロジック層 100%（床 80%）、保存層 98.38%（床 80%）— 両方達成 |
| 要件の網羅 | 合格（42 件すべて対応、未対応 0） |
| 品質目標 | 16 件達成、2 件**未確認**、未達 0 |
| **この工程の判定** | **失敗**（未確認の目標が残るため。内容は下記） |

「失敗」は工程の定義（適用対象の目標に `Unverified` があれば失敗）によるもので、コードの不具合ではない。未確認の 2 件はいずれも**この開発機に Android の実行環境がない**ことが原因。

## Prerequisites（前提）

- Node.js 20 以上、npm。`npm ci` で依存を取得
- 環境変数・外部サービス・ローカルサービスは不要（通信なし、キーなし）
- 端末に載せるには本人のスマホが必要。Android SDK があれば開発ビルド、なければ Expo Go

## Test Type Inventory（作った手順書と実行したテストの種類）

Test Strategy は `Standard`。標準では結合テストの手順書のみだが、NFR1（性能）と NFR6（セキュリティ）に測れる目標があり、後続の検証工程を省いているため、性能とセキュリティの手順書も作って実行した。

| 種類 | 手順書 | 実行 | 結果 |
|------|--------|------|------|
| ビルド | `build-instructions.md` | 済 | 成功 |
| 単体（層ごと） | `../catches/code-generation/unit-test-instructions.md`（前工程） | 済 | 128 本中 124 本 |
| 結合（層の境界・画面遷移） | `integration-test-instructions.md` | 済 | 上記に含む |
| 性能 | `performance-test-instructions.md` | 済 | 4 項目すべて上限内（最大 251ms / 上限 1000ms） |
| セキュリティ | `security-test-instructions.md` | 済 | 5 項目すべて合格（依存監査は Moderate 13 の警告あり） |
| 自動 E2E | — | 行わない | Standard の範囲外（team.md） |

## Coverage Expectations per Unit（作業単位ごとのカバレッジ）

作業単位は `catches`（`u1-catches`）の1つ。

| 層 | 床 | 実測（行） | 判定 |
|----|----|-----------|------|
| ロジック層 `src/catches/log/` | 80% | 100% | 達成 |
| 保存層 `src/catches/store/` | 80% | 98.38% | 達成 |
| 画面層 `src/catches/ui/` | 床なし | 95.93% | 計測のみ |
| 画面のルート `app/` | 床なし | 92.85% | 計測のみ |

## Target Verification Matrix（品質目標の検証）

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
|-----------|--------|----------|--------|----------|--------------|---------|
| NFR1-list-1s | requirements.md NFR1 | 一覧の取得が 500 件で 1 秒以内 | 1.0ms | `src/catches/store/__tests__/performance.test.ts` | build-and-test | Met |
| NFR1-filter-1s | requirements.md NFR1 | 絞り込みが 500 件で 1 秒以内 | 0.0ms | 同上 | build-and-test | Met |
| NFR1-options-1s | requirements.md NFR1 | 絞り込み候補の算出が 500 件で 1 秒以内 | 0.0ms | 同上 | build-and-test | Met |
| NFR1-render-1s | requirements.md NFR1 | 一覧画面の表示が 500 件で 1 秒以内 | 251.0ms | `src/catches/ui/__tests__/CatchListScreen.performance.test.tsx` | build-and-test | Met |
| NFR1-scroll-60fps | requirements.md NFR1 | 500 件でスクロールに目に見える停止がない | 未計測 | README の手動チェックリスト | 端末での人の確認（後続工程なし） | Unverified |
| NFR2-android | requirements.md NFR2 | Android のスマホ・縦画面で動作 | `minSdkVersion: 24` 設定、バンドル生成成功 | `app.json`、`npx expo export` | build-and-test | Met |
| NFR2-device-run | requirements.md NFR2 | 本人の端末で動く | 未実行（adb・Android SDK なし） | README の手動チェックリスト | 端末での人の確認（後続工程なし） | Unverified |
| NFR3-durability | requirements.md NFR3 | 削除するまで釣果が失われない | ファイル DB を開き直しても残る | `catch-repository.test.ts` | build-and-test | Met |
| NFR4-offline | requirements.md NFR4 | 通信なしで動作 | ネットワーク呼び出しなし、テストは外部接続なしで成功 | `src/catches/store/` | build-and-test | Met |
| NFR5-coverage-log | team.md Testing Posture | ロジック層 行 80% 以上 | 100% | `jest.config.js` の閾値 | build-and-test | Met |
| NFR5-coverage-store | team.md Testing Posture | 保存層 行 80% 以上 | 98.38% | 同上 | build-and-test | Met |
| NFR5-methodology | code-generation-plan.md Testing Contract | test-after、ロジック → 保存 → 画面 | 順序どおり実装 | `code-summary.md`、コミット履歴 | code-generation | Met |
| NFR6-secrets | project.md Forbidden | 秘密情報をコミットしない | アプリソースに一致なし、除外設定 7 パターン | `security-test-instructions.md` | build-and-test | Met |
| NFR6-private-storage | requirements.md NFR6 | 他のアプリから読めない領域に保存 | `Paths.document` 配下 | `expo-photo-files.ts` | build-and-test | Met |
| NFR6-deps | team.md Deployment | 修正版のある Critical / High なし | Critical 0、High 0、Moderate 13 | `npm audit --json` | build-and-test | Met |
| NFR7-a11y | requirements.md NFR7 | タップ 44px 以上、代替テキスト、見出し | `MIN_TAP_SIZE = 44`、代替テキスト生成 | `theme.ts`、画面テスト | build-and-test | Met |
| NFR8-usability | requirements.md NFR8 | 登録は1画面・必須は写真・3操作以内 | 満たす | `CatchFormScreen.tsx` | build-and-test | Met |
| NFR9-maintainability | requirements.md NFR9 | 文言は1か所、画面が保存層を直接呼ばない | 満たす | `messages.ts`、レビュー | code-generation | Met |

**内訳**: Met 16 / Unverified 2 / Not Met 0

## Readiness Assessment（準備状況）

| 観点 | 状態 | 根拠 |
|------|------|------|
| ビルド可能（build-ready） | **可** | `npm ci` → `npm run check` → `npx expo export` がすべて成功 |
| テスト可能（test-ready） | **可** | 128 本が追加設定なしで実行でき、すべて成功。カバレッジの床も設定済み |
| 取り込み可能（マージ可） | **可** | チームルールの暫定ゲート（`npm run check` が緑）を満たす。`bolt-catches` → `main` の squash-merge が可能 |
| 配布可能（deployment-ready） | **条件付き** | バンドルは生成できるが、端末での動作確認が未実施。本人のスマホで README のチェックリストを通すまでは「配布可能」と言い切れない |

## Known Limitations / Outstanding Items（残っていること）

1. **端末での動作確認が未実施**（NFR2-device-run、NFR1-scroll-60fps）。この開発機（WSL2）に Android SDK・adb・Java がないため。本人のスマホで README の手動チェックリスト（7 項目）を通す必要がある。確認方法は Expo Go ＋ `npx expo start --tunnel`（推奨）または Android SDK がある環境で `npx expo run:android`
2. **依存の Moderate 脆弱性 13 件**。すべて `@expo/config` 系のビルド時ツール。実行時コードには含まれない。Expo SDK の更新で解消見込み。CI 整備の工程で監査をパイプラインに組み込む
3. **写真の位置情報（EXIF の GPS）**の扱いは未決定。友達と共有する段階（FR5.3）までに決める
4. **端末の Android バージョンが未記録**。README に「未確認」と残してある。本人の端末で確認して記録すると、対応バージョンの下限の判断がより確かになる

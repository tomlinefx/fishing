# 釣果（fishing-catches）

自分の釣果を写真付きで記録し、一覧・絞り込み・詳細・削除ができる Android 向けアプリです（React Native + Expo）。通信は一切使わず、データは端末内（SQLite とアプリ専用領域の写真ファイル）に保持します。

## 前提

- Node.js 20 以上、npm（開発機。確認済み: Node v24.16.0 / npm 11.13.0）
- Android スマホ（Android 7.0 以上。Expo の既定 `minSdkVersion` 24）
- 手元のスマホで動かす方法は2つあります（下記「スマホで動かす」）。方法 A は Android SDK 不要、方法 B は Android Studio（SDK・JDK）と USB デバッグが必要です
- 端末の Android バージョン: **未確認**（開発機（WSL2）に `adb` がなく `adb shell getprop ro.build.version.release` を実行できませんでした。Expo の既定 `minSdkVersion` 24 = Android 7.0 以上で動作します。確認できたらここに記録してください）

## セットアップ

```sh
npm ci
```

`package-lock.json` をコミットしているので、`npm ci` で同じ依存関係が再現されます。

## 品質チェック（マージ前ゲート）

リポジトリ直下の1コマンドで、整形チェック → リント → 型検査 → テスト（カバレッジ付き）を順に実行します。これが緑のものだけを `main` に取り込みます。

```sh
npm run check
```

内訳:

| コマンド               | 内容                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check` | Prettier による整形チェック（`npm run format` で自動整形）                                                                                                                |
| `npm run lint`         | ESLint（`eslint-config-expo`、テストコードも対象）                                                                                                                        |
| `npm run typecheck`    | `tsc --noEmit`（TypeScript strict）                                                                                                                                       |
| `npm run test`         | Jest（`jest-expo`）＋カバレッジ。ロジック層 `src/catches/log/` と保存層 `src/catches/store/` は行カバレッジ 80% 以上が必須（`jest.config.js` の閾値。通すために下げない） |

この作業単位（catches）のテストだけを走らせる場合:

```sh
npx jest --coverage --rootDir . src/catches app
```

層ごとに走らせる場合は `--coverage` を付けずに実行してください（`--coverage` 付きで一部だけ走らせると、走らせていない層の閾値が「未達」と表示されます）:

```sh
npx jest --rootDir . src/catches/log      # ロジック層
npx jest --rootDir . src/catches/store    # 保存層
npx jest --rootDir . src/catches/ui app   # 画面層
```

## スマホで動かす

### 方法 A（推奨・Android SDK 不要）: Expo Go

1. スマホに Google Play から **Expo Go** をインストールします。
2. 開発機で開発サーバーを起動します。WSL2 では同じ Wi-Fi にいても LAN 接続が通らないことが多いため `--tunnel` を付けます（初回は `@expo/ngrok` の導入を求められるので同意します）。

   ```sh
   npx expo start --tunnel
   ```

3. 端末側で Expo Go を開き、ターミナルに出た QR コードを読み取ります。
4. このアプリが使うモジュール（expo-router、expo-sqlite、expo-file-system、expo-image-manipulator、expo-image-picker、expo-crypto、expo-linking）はすべて Expo Go に含まれているため、ネイティブビルドなしで動きます。
5. カメラ・写真の許可は、Expo Go アプリに対して求められます（初回の「カメラで撮る」「写真を選ぶ」の操作時）。

補足: Expo Go 上のデータ（釣果と写真）は Expo Go アプリのサンドボックス内に保存されます。方法 B の開発ビルドとはデータを共有しません。

### 方法 B: 開発ビルドを端末に載せる（Android Studio / SDK が入っている場合）

前提: Android Studio（SDK、JDK 17）、`ANDROID_HOME` の設定、端末の USB デバッグを有効化、`adb devices` で端末が見えていること。

```sh
npx expo run:android
```

初回は `android/` ディレクトリが生成（prebuild）され、Gradle でビルドされてから端末にインストールされます。`app.json` の `expo-build-properties` にある `minSdkVersion: 24` と、`expo-image-picker` の許可文言（日本語）はこの方法 B のネイティブビルドに適用されます。

クラウドでビルドする場合は EAS Build（`npx eas build --platform android --profile development`）も使えます（Expo アカウントが必要）。

### 端末の Android バージョンを記録する

方法 B の環境（`adb` あり）では次で確認できます。

```sh
adb devices
adb shell getprop ro.build.version.release
```

## 不具合時のロールバック

「1つ前の緑の状態を再ビルドして載せ直す」が手順です。

```sh
git log --oneline main            # 緑だったコミットを探す
git checkout <緑だったコミット>
npm ci                            # ロックファイルどおりに依存を再現
npx expo start --tunnel           # 方法 A、または npx expo run:android（方法 B）
```

確認が終わったら `git checkout main` で戻ります。

## 端末での手動チェックリスト（PU-1 完了時）

自動 E2E はないため、本人のスマホで次を確認します。

- [ ] 初回起動で「まだ釣果がありません」と「釣果を登録する」が出る
- [ ] （＋）から登録できる（写真を撮る／選ぶ、魚種・サイズ・重さ・場所は任意）
- [ ] 写真なしで保存すると「写真を添付してください」が出て保存されない
- [ ] サイズに「abc」や「25.55」を入れると文言が出る。重さに小数を入れると文言が出る
- [ ] 一覧が新しい順に並ぶ
- [ ] チップで魚種・場所を絞り込め、両方選ぶと AND になる。もう一度タップで解除
- [ ] カードをタップすると詳細（原本の写真）が出る。未入力の項目は出ない
- [ ] 削除は確認が出て、承諾すると一覧から消える
- [ ] アプリを完全終了して再起動しても釣果が残っている（削除したものは戻らない）
- [ ] 機内モード（電波なし）で登録・一覧・詳細・削除が動く
- [ ] カメラ・写真の許可を拒否すると「写真を添付するには許可が必要です」と「設定を開く」が出る
- [ ] TalkBack で写真の代替テキスト（「{魚種} {サイズ}cm {場所} の写真」）が読まれる。ボタンは指で押しやすい（44px 以上）
- [ ] 入力途中で戻ると「入力を破棄しますか？」が出る

## 秘密情報の扱い

この作業単位は外部サービスのキーを使いません。将来キーが必要になった場合は、ソースやビルド成果物に埋め込まず、環境変数（`.env`、gitignore 済み）または EAS のシークレットから渡します。`.env*`、鍵ファイル（`*.pem`、`*.keystore`、`*.jks`、`*.p12`）、`google-services.json` は `.gitignore` で除外しています。

## ディレクトリ構成

```
app/                      expo-router の画面ルート（index=一覧、new=登録、catch/[id]=詳細）
src/catches/
  messages.ts             画面文言（1か所に集約）
  composition.ts          本番の部品を組み立てる根（ここだけが保存層を直接参照）
  log/                    ロジック層 CatchLog（型、検証、サービス、整形、保存層のインタフェース）
  store/                  保存層 CatchStore（SQL ドライバ、スキーマ、リポジトリ、写真ファイル、初期化）
  ui/                     画面層 CatchUI（AppShell、S1/S2/S3、部品）
  __tests__/              テスト用のフィクスチャとフェイク
jest.config.js            テスト設定（層別のカバレッジ閾値）
eslint.config.js / .prettierrc  リンタ・フォーマッタ設定
```

依存の向きは「画面 → ロジック ← 保存」です。画面は `CatchLog` だけを呼び、保存層を直接参照しません。

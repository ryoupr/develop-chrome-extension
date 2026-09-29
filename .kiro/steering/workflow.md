# Chrome拡張機能 開発ワークフロー

## テンプレートリポジトリ
- https://github.com/ryoupr/develop-chrome-extension
- 新しい拡張機能を作る際は「Use this template」から新リポジトリを作成する
- フレームワーク: [WXT](https://wxt.dev/)（Vite ベース / TypeScript / Manifest V3）
- ツール: Biome（lint / format）、Vitest（ユニットテスト）、GitHub Actions（CI / リリース）

## 開発フロー

### Phase 1: プロジェクト作成
1. GitHubで「Use this template」→ 新リポジトリ作成（命名: 拡張機能の機能を表す名前）
2. `git clone` してローカルに取得し、`npm install`（`postinstall` で `wxt prepare` が走り型定義が生成される）
   - Node.js のバージョンは `.node-version` を参照（fnm / mise / nodenv 等で自動切り替え可）
3. `npm run setup` で基本情報を設定（対話形式。引数指定も可: `npm run setup -- --help`）。以下が書き換わる:
   - `public/_locales/{ja,en}/messages.json`: `extName`（表示名、75文字以内）, `extDescription`（説明、132文字以内）
   - `package.json`: `name`（ZIP名に使用。kebab-case）, `description`
   - `entrypoints/content/index.ts` の `matches`: 対象URL
   - `utils/class-name.ts` の `CLASS_PREFIX`: CSSクラス名のプレフィックス
4. `wxt.config.ts` の `manifest` に `permissions`, `host_permissions` 等を追加（`default_locale` は `ja`）

### Phase 2: 実装
1. `entrypoints/content/index.ts` の `main()` にメインロジックを実装
2. `entrypoints/content/style.css` にスタイルを実装
3. テスト可能なロジックは `utils/` に切り出し、隣に `*.test.ts` を置く（`utils/` の export は自動 import される）
4. 外部ライブラリは `npm install <pkg>` で追加し、`import` して使う（バンドルされる）
5. 他のエントリーポイントが必要なら `entrypoints/` に追加する（manifest には自動反映）
   - `background.ts` / `popup/index.html` / `options/index.html` / `sidepanel/index.html` など
   - 詳細: https://wxt.dev/guide/essentials/entrypoints.html
6. UIに表示する文言は `public/_locales/*/messages.json` に追加し、`browser.i18n.getMessage('key')` で参照する
7. 動作確認:
   - `npm run dev` → 拡張機能を読み込んだ Chrome が起動し、変更がホットリロードされる
   - ブラウザを自動起動できない環境では `npm run build` → `chrome://extensions/` → デベロッパーモード →「パッケージ化されていない拡張機能を読み込む」で `.output/chrome-mv3/` を選択
8. `npm run check`（lint + 型チェック + テスト）が通ることを確認。整形は `npm run lint:fix`

### Phase 3: アセット準備
```bash
# アイコン生成（128px以上の正方形画像を用意）→ public/icon/{16,32,48,128}.png
./script/generate-icons.sh source-icon.png

# スクリーンショット撮影後、Chrome Web Store用にリサイズ
./script/resize-to-1280x800.sh screenshot/*.png
```
- `public/icon/` のアイコンは WXT が自動検出して manifest の `icons` に設定する
- どちらも ImageMagick を使用（macOS / Linux 両対応）

### Phase 4: 公開
初回はストアへの登録が必要なため手動で行う:
```bash
# Chrome Web Store用ZIPを作成 → .output/{name}-{version}-chrome.zip
npm run zip
```
- 生成されたZIPを Chrome Web Store Developer Dashboard にアップロード
- URL: https://chrome.google.com/webstore/devconsole/

2回目以降の自動提出を使う場合は、初回公開後に `npm run setup:publish` を実行する:
1. `wxt submit init` で `.env.submit` を作成（ストアは Chrome Web Store、API は v2 を選択）
2. `wxt submit --dry-run` で認証を確認
3. `.env.submit` の内容を GitHub Secret `WXT_SUBMIT_ENV` に登録（`gh` が必要。ない場合は手動登録の手順が表示される）
- Secret が未登録なら Release ワークフローの提出ステップはスキップされる
- 登録後、Actions の「Release」を手動実行（デフォルトは dry-run）して CI からの認証を確認する

### Phase 5: バージョンアップ
1. 変更を実装し、`npm run check` を通す
2. `npm version patch`（または `minor` / `major`）で `package.json` の `version` を上げ、`v*` タグを作成
3. `git push --follow-tags` でタグを push
4. Release ワークフローが自動で実行される:
   - `npm run check` → タグと `package.json` の version の一致確認 → ZIP 作成
   - GitHub Release を作成して ZIP を添付
   - Secret `WXT_SUBMIT_ENV` が設定されていれば Chrome Web Store に提出
5. 自動提出を使わない場合は、GitHub Release の ZIP を Developer Dashboard にアップロード

### CI・依存関係の更新
- プルリクエストと main への push で CI（lint / 型チェック / テスト / ZIP 作成）が実行され、ZIP が Artifacts に保存される
- Dependabot が npm パッケージと GitHub Actions の更新プルリクエストを毎週作成する（CI が通ればマージしてよい）

## Agent向け指示

### 新規拡張機能の開発を依頼された場合
ユーザーが拡張機能の要件を伝えたら、以下を**確認を挟まず自律的に完了**まで進めること。

1. `npm install`（未実行の場合。Claude Code on the web ではセッション開始フックで自動実行される）
2. `npm run setup -- --yes --name "<日本語名>" --name-en "<英語名>" --description "<説明>" --description-en "<英語の説明>" --matches "<対象URL>"` で基本情報を設定（パッケージ名とプレフィックスは英語名から自動生成。`--package` / `--prefix` で指定も可）
3. `wxt.config.ts` に必要な `permissions` 等を追加
4. `entrypoints/content/index.ts` に要件のメインロジックを実装
5. `entrypoints/content/style.css` を実装（必要なスタイル）
6. background / popup 等が必要なら `entrypoints/` に追加
7. 外部ライブラリが必要な場合は `npm install` で追加
8. 分岐や変換などのロジックは `utils/` に切り出してテストを書く
9. `npm run check` と `npm run build` が通ることを確認（lint エラーは `npm run lint:fix` で整形してから直す）
10. 実装完了後、動作確認手順（`npm run dev`、または `.output/chrome-mv3/` の読み込み）をユーザーに提示
11. ユーザーがアイコン画像を提供したら `./script/generate-icons.sh` を実行
12. `npm run zip` でZIPを作成

### 自律実行の判断基準
- **確認不要**: `npm run setup` の実行、messages.json / package.json / wxt.config.ts 編集、コード実装、スタイル実装、テスト追加、npm パッケージ追加 → そのまま進める
- **ユーザー待ち**: アイコン画像の提供、Chrome Web Storeへの初回アップロード、`npm run setup:publish`（認証情報の入力が必要） → ユーザーに依頼。アイコンが未提供の場合は https://ryoupr.github.io/home/tools/icon-generator で簡易作成できることを案内する
- **確認必要**: 要件が曖昧で複数の解釈がある場合、リリース用タグの push → 最小限の質問で確認

### サブエージェントの活用
開発速度を最大化するため、独立したタスクは積極的にサブエージェントで並列実行すること。

**並列化の例:**
- 独立したエントリーポイント（content / background / popup）の実装を同時に進める
- スクリプトの実装と `style.css` の実装を同時に進める
- `utils/` のロジック実装とテスト作成を同時に進める
- 複数ファイルのレビューを同時に実行する

**並列化してはいけない例:**
- `wxt.config.ts` の permissions やエントリーポイント間のメッセージ仕様に依存する実装（仕様確定後に実装）
- `npm run check` / `npm run build` / `npm run zip`（全ファイルが揃ってから）

### コード規約
- TypeScript で書き、`npm run check`（Biome / tsc / Vitest）が通る状態を保つ
- フォーマットは Biome に従う（2スペース、シングルクォート）
- エントリーポイントは `defineContentScript` / `defineBackground` 等でラップする（WXT が自動 import するため import 不要）
- ブラウザ API は `chrome.*` ではなく `browser.*`（WXT 提供）を使う。テストでは `wxt/testing/fake-browser` の `fakeBrowser` を使う
- DOM操作は `MutationObserver` 等で遅延要素に対応する。content script の後始末が必要な処理は `main(ctx)` の `ctx`（`ctx.addEventListener`, `ctx.setInterval`, `ctx.onInvalidated`）を使う
- 追加する要素のクラス名は `cn('button')`（→ `myext-button`）でプレフィックスを付け、既存サイトとの衝突を防ぐ。プレフィックスは `utils/class-name.ts` の `CLASS_PREFIX` で変更する。強い分離が必要なら `createShadowRootUi` を使う
- UI の文言はハードコードせず `_locales` に置く
- `manifest.json` は直接作成しない（WXT が `wxt.config.ts` とエントリーポイントから生成する）

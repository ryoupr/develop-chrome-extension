# Chrome拡張機能開発ツールキット

[WXT](https://wxt.dev/) をベースにした Chrome拡張機能の開発テンプレート・ツールキットです。TypeScript・ホットリロード・manifest 自動生成に加え、lint・テスト・CI、アイコン生成、Chrome Web Store への提出まで、開発からリリースまでの一貫したワークフローを提供します。

## 📦 このテンプレートの使い方

1. 画面右上の **「Use this template」** → **「Create a new repository」** をクリック
2. リポジトリ名と公開設定を入力して作成
3. 作成されたリポジトリをクローンして開発開始

```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
npm install
npm run dev
```

4. 以下を編集して開発開始:
   - [ ] `public/_locales/{ja,en}/messages.json` の `extName`（表示名）と `extDescription`（説明）を変更
   - [ ] `package.json` の `name` を変更（ZIPのファイル名に使われます）
   - [ ] `wxt.config.ts` に必要な `permissions` を追加
   - [ ] `entrypoints/content/index.ts` の `matches` を対象URLに変更
   - [ ] `entrypoints/content/index.ts` にメインロジックを実装
   - [ ] `entrypoints/content/style.css` にスタイルを実装
   - [ ] `utils/class-name.ts` の `CLASS_PREFIX` を拡張機能固有の値に変更

## 🚀 主な機能

- **WXT**: TypeScript、ホットリロード、エントリーポイントからの manifest 自動生成
- **品質管理**: Biome（lint / format）、Vitest（ユニットテスト）
- **CI / リリース**: プルリクエストごとの自動チェック、タグ push で GitHub Release 作成と Chrome Web Store 提出
- **依存関係の自動更新**: Dependabot が npm と GitHub Actions の更新を提案
- **多言語対応**: 日本語 / 英語の `_locales` 雛形
- **アイコン自動生成**: 1つの画像から複数サイズのアイコンを自動生成
- **画像リサイズツール**: スクリーンショット用画像の自動調整
- **Claude Code 対応**: `CLAUDE.md` とエージェント向けワークフロー、Claude Code on the web 用のセッション開始フック
- **日本語ドキュメント**: 完全日本語対応のドキュメントとツール

## 📋 必要な環境

### 必須
- **Node.js**: `.node-version` 参照（24 LTS。22 以上で動作）

### アセット用スクリプト
- **ImageMagick**: アイコン生成・スクリーンショットのリサイズ用（macOS / Linux）

```bash
# macOS
brew install imagemagick

# Ubuntu
sudo apt-get install imagemagick
```

## 🛠️ 使用方法

### npm スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 拡張機能を読み込んだ Chrome を起動し、変更をホットリロード |
| `npm run check` | lint + 型チェック + テストをまとめて実行 |
| `npm run lint` / `npm run lint:fix` | Biome でチェック / 整形・自動修正 |
| `npm run compile` | TypeScript の型チェック |
| `npm run test` / `npm run test:watch` | Vitest でテスト / 監視モード |
| `npm run build` | `.output/chrome-mv3/` に本番ビルド |
| `npm run zip` | Chrome Web Store 用ZIPを `.output/` に作成 |
| `npm run submit` | Chrome Web Store に提出（通常は Release ワークフローから実行） |

### 1. アイコン生成

1つの画像から Chrome拡張機能に必要な全サイズのアイコンを自動生成します。

```bash
./script/generate-icons.sh source-icon.png
```

**生成されるアイコン:**
- `public/icon/16.png` (16x16px) - ファビコン・ツールバー
- `public/icon/32.png` (32x32px) - Windows等での表示
- `public/icon/48.png` (48x48px) - 拡張機能管理ページ
- `public/icon/128.png` (128x128px) - Chrome Web Store表示

`public/icon/` のアイコンは WXT がビルド時に自動検出し、manifest の `icons` に設定します。

**推奨事項:**
- 正方形の画像を使用（正方形でない場合は透明の余白を付けて正方形にします）
- 128px以上の高解像度画像を推奨
- PNG / JPEG / WebP 形式で入力

### 2. Chrome Web Store用パッケージ作成

```bash
npm run zip
```

`.output/{name}-{version}-chrome.zip` が作成されます（`name` / `version` は `package.json` の値）。

### 3. スクリーンショット画像のリサイズ

Chrome Web Store用のスクリーンショット画像を1280x800サイズに調整します。

```bash
# 単一ファイル
./script/resize-to-1280x800.sh screenshot.png

# 複数ファイル
./script/resize-to-1280x800.sh *.jpg *.png

# ディレクトリ内の全画像
./script/resize-to-1280x800.sh screenshot/

# 出力ディレクトリを指定
./script/resize-to-1280x800.sh -o output/ *.jpg

# 確認なしで上書き
./script/resize-to-1280x800.sh -y screenshot.png
```

**機能:**
- 縦横比を保持してリサイズ
- 透明背景でPNG出力
- 複数ファイルの一括処理
- ディレクトリ指定での自動検出

### 4. 多言語対応

拡張機能名・説明・UIの文言は `public/_locales/<言語>/messages.json` で管理します（`default_locale` は `ja`）。

```json
{
  "extName": { "message": "My Extension" },
  "extDescription": { "message": "Chrome拡張機能の説明" }
}
```

コードからは `browser.i18n.getMessage('extName')` で参照できます。言語を追加する場合は `public/_locales/<言語コード>/messages.json` を作成します。

## 📁 プロジェクト構造

```
.
├── package.json                 # パッケージ名・バージョン・npmスクリプト
├── wxt.config.ts                # WXT設定（manifest の permissions 等）
├── biome.json                   # Biome設定
├── vitest.config.ts             # Vitest設定
├── tsconfig.json                # TypeScript設定
├── .node-version                # Node.js バージョン
├── entrypoints/                 # エントリーポイント（manifest に自動反映）
│   └── content/
│       ├── index.ts             # コンテンツスクリプト（編集して使用）
│       └── style.css            # スタイルシート（編集して使用）
├── utils/                       # 共通ロジック（自動 import）とテスト
├── public/
│   ├── _locales/                # 多言語メッセージ（ja / en）
│   └── icon/                    # アイコン格納
├── screenshot/                  # スクリーンショット格納
├── script/                      # アセット用スクリプト
├── .github/                     # CI / リリースワークフロー、Dependabot
└── .claude/                     # Claude Code 設定（セッション開始フック）
```

background / popup / options などが必要な場合は `entrypoints/` にファイルを追加すると manifest に自動で反映されます（[エントリーポイントの一覧](https://wxt.dev/guide/essentials/entrypoints.html)）。

## 🔄 開発ワークフロー

### 1. 初期設定
```bash
git clone <repository-url>
cd <repository-name>
npm install
```

### 2. 拡張機能の開発
```bash
# 1. messages.json / package.json / wxt.config.ts を編集
# 2. entrypoints/content/index.ts, style.css を実装
# 3. 開発サーバーで動作確認（Chromeが起動し、変更がホットリロードされる）
npm run dev
```

### 3. テストとデバッグ
```bash
npm run check     # lint + 型チェック + テスト
npm run build     # .output/chrome-mv3/ にビルド
```
ブラウザの自動起動を使わない場合は、`chrome://extensions/` で「デベロッパーモード」を有効にし、`.output/chrome-mv3/` を「パッケージ化されていない拡張機能を読み込む」で読み込みます。

テストは対象ファイルの隣に `*.test.ts` を置きます。`browser.*` API は [fakeBrowser](https://webext-core.aklinker1.io/fake-browser/installation) に置き換わるため、`browser.storage` などもモックなしでテストできます（[WXT のユニットテストガイド](https://wxt.dev/guide/essentials/unit-testing.html)）。

### 4. アセット準備
```bash
./script/generate-icons.sh your-icon.png
./script/resize-to-1280x800.sh screenshot.png
```

### 5. 初回公開
```bash
npm run zip
```
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/) にアクセス
- `.output/` に生成されたZIPファイルをアップロード

### 6. バージョンアップ（自動リリース）
```bash
npm version patch          # package.json の version を上げて v* タグを作成
git push --follow-tags     # タグを push すると Release ワークフローが実行される
```

Release ワークフローは `npm run check` → ZIP 作成 → GitHub Release 作成（ZIP添付）を行い、Chrome Web Store の Secrets が登録されていれば審査に提出します。

## 🤖 GitHub Actions

| ワークフロー | トリガー | 内容 |
|---|---|---|
| CI (`ci.yml`) | プルリクエスト / main への push | lint・型チェック・テスト・ZIP作成（ZIPは Artifacts に保存） |
| Release (`release.yml`) | `v*` タグの push / 手動実行 | GitHub Release 作成、Chrome Web Store への提出 |

### Chrome Web Store への自動提出

リポジトリの **Settings → Secrets and variables → Actions** に以下を登録すると、Release ワークフローが Chrome Web Store API v2 で提出します。未登録の場合、提出ステップはスキップされます。

| Secret | 内容 |
|---|---|
| `CHROME_EXTENSION_ID` | 拡張機能のID |
| `CHROME_PUBLISHER_ID` | パブリッシャーID |
| `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` | サービスアカウントのメールアドレス |
| `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` | サービスアカウントの秘密鍵 |

値の取得方法は `npx wxt submit init` の案内、または [WXT の公開ガイド](https://wxt.dev/guide/essentials/publishing.html) を参照してください。登録後は Actions タブから「Release」を手動実行すると（デフォルトは dry-run）、実際に提出せずに認証を確認できます。

## 🔧 トラブルシューティング

### よくある問題

**Q: `convert: command not found` / `ImageMagickが見つかりません` エラーが出る**
A: ImageMagickがインストールされていません。`brew install imagemagick`（Ubuntu は `sudo apt-get install imagemagick`）でインストールしてください。

**Q: `defineContentScript` などの型が見つからないエラーが出る**
A: `.wxt/` の型定義が未生成です。`npm install`（または `npx wxt prepare`）を実行してください。

**Q: `npm run dev` でブラウザが起動しない**
A: Chrome が見つからない環境では、`npm run build` 後に `.output/chrome-mv3/` を手動で読み込んでください。Chrome のパス指定などは [WXT のドキュメント](https://wxt.dev/guide/essentials/config/browser-startup.html) を参照してください。

**Q: Release ワークフローが「タグと package.json の version が一致しません」で失敗する**
A: タグは `npm version` で作成してください。手動でタグを作る場合は `package.json` の `version` と同じ値（例: `v1.2.3`）にします。

### ログの確認

アセット用スクリプトは詳細なログを出力します：
- 🔵 `[INFO]`: 情報メッセージ
- 🟢 `[SUCCESS]`: 成功メッセージ
- 🟡 `[WARNING]`: 警告メッセージ
- 🔴 `[ERROR]`: エラーメッセージ

## 📝 wxt.config.ts の例

`manifest.json` は WXT が生成します。`version` は `package.json` から、表示名と説明は `_locales` から、アイコンは `public/icon/` から、コンテンツスクリプトは `entrypoints/` から自動で設定されます。

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'ja',
    permissions: ['storage'],
    host_permissions: ['https://example.com/*'],
  },
});
```

```ts
// entrypoints/content/index.ts
import './style.css';

export default defineContentScript({
  matches: ['https://example.com/*'],
  runAt: 'document_end',
  main(ctx) {
    const button = document.createElement('button');
    button.className = cn('button'); // → 'myext-button'
    button.textContent = browser.i18n.getMessage('extName');
    document.body.append(button);
  },
});
```

## 🤝 貢献

プルリクエストや Issue の報告を歓迎します。

## 📄 ライセンス

MIT License

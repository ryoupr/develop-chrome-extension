# Chrome拡張機能開発ツールキット

[WXT](https://wxt.dev/) をベースにした Chrome拡張機能の開発テンプレート・ツールキットです。TypeScript・ホットリロード・manifest 自動生成に加え、アイコン生成からパッケージングまで、開発からリリースまでの一貫したワークフローを提供します。

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
   - [ ] `package.json` の `name`, `description` を変更
   - [ ] `wxt.config.ts` の `manifest.name` を変更し、必要に応じて `permissions` を追加
   - [ ] `entrypoints/content/index.ts` の `matches` を対象URLに変更
   - [ ] `entrypoints/content/index.ts` にメインロジックを実装
   - [ ] `entrypoints/content/style.css` にスタイルを実装

## 🚀 主な機能

- **WXT**: TypeScript、ホットリロード、エントリーポイントからの manifest 自動生成
- **パッケージング**: `npm run zip` で Chrome Web Store 用ZIPを作成
- **アイコン自動生成**: 1つの画像から複数サイズのアイコンを自動生成
- **画像リサイズツール**: スクリーンショット用画像の自動調整
- **日本語ドキュメント**: 完全日本語対応のドキュメントとツール

## 📋 必要な環境

### 必須
- **Node.js 22 以上**

### アセット用スクリプト
- **macOS** (推奨)
- **sips**: macOS標準のコマンドラインツール (アイコン生成用)
- **ImageMagick**: 画像処理ライブラリ (スクリーンショットのリサイズ用)

```bash
# Homebrewを使用
brew install imagemagick
```

## 🛠️ 使用方法

### npm スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 拡張機能を読み込んだ Chrome を起動し、変更をホットリロード |
| `npm run build` | `.output/chrome-mv3/` に本番ビルド |
| `npm run zip` | Chrome Web Store 用ZIPを `.output/` に作成 |
| `npm run compile` | TypeScript の型チェック |

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
- 正方形の画像を使用
- 128px以上の高解像度画像を推奨
- PNG形式で入力

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

## 📁 プロジェクト構造

```
.
├── README.md                    # プロジェクト概要
├── .gitignore                   # Git除外設定
├── package.json                 # 拡張機能名・バージョン・npmスクリプト
├── wxt.config.ts                # WXT設定（manifest の name / permissions 等）
├── tsconfig.json                # TypeScript設定
├── entrypoints/                 # エントリーポイント（manifest に自動反映）
│   └── content/
│       ├── index.ts             # コンテンツスクリプト（編集して使用）
│       └── style.css            # スタイルシート（編集して使用）
├── public/
│   └── icon/                    # アイコン格納
├── screenshot/                  # スクリーンショット格納
└── script/                      # アセット用スクリプト
    ├── generate-icons.sh
    └── resize-to-1280x800.sh
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
# 1. package.json / wxt.config.ts を編集
# 2. entrypoints/content/index.ts, style.css を実装
# 3. 開発サーバーで動作確認（Chromeが起動し、変更がホットリロードされる）
npm run dev
```

### 3. テストとデバッグ
```bash
npm run compile   # 型チェック
npm run build     # .output/chrome-mv3/ にビルド
```
ブラウザの自動起動を使わない場合は、`chrome://extensions/` で「デベロッパーモード」を有効にし、`.output/chrome-mv3/` を「パッケージ化されていない拡張機能を読み込む」で読み込みます。

### 4. アセット準備
```bash
./script/generate-icons.sh your-icon.png
./script/resize-to-1280x800.sh screenshot.png
```

### 5. パッケージング
```bash
npm version patch   # バージョンアップ時
npm run zip
```

### 6. 公開
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/) にアクセス
- `.output/` に生成されたZIPファイルをアップロード

## 🔧 トラブルシューティング

### よくある問題

**Q: `sips: command not found` エラーが出る**
A: macOS以外の環境では`sips`コマンドが利用できません。macOS環境で実行してください。

**Q: `convert: command not found` エラーが出る**
A: ImageMagickがインストールされていません。`brew install imagemagick`でインストールしてください。

**Q: アイコンが歪んで見える**
A: 元画像が正方形でない可能性があります。正方形の画像を使用してください。

**Q: `defineContentScript` などの型が見つからないエラーが出る**
A: `.wxt/` の型定義が未生成です。`npm install`（または `npx wxt prepare`）を実行してください。

**Q: `npm run dev` でブラウザが起動しない**
A: ブラウザの自動起動には `web-ext`（devDependencies に含む）が必要です。`Load ".output/chrome-mv3-dev" as an unpacked extension manually` と表示される場合は `npm install` で `web-ext` が入っているか確認してください。Chrome が見つからない環境では、`npm run build` 後に `.output/chrome-mv3/` を手動で読み込んでください。Chrome のパス指定などは [WXT のドキュメント](https://wxt.dev/guide/essentials/config/browser-startup.html) を参照してください。

### ログの確認

アセット用スクリプトは詳細なログを出力します：
- 🔵 `[INFO]`: 情報メッセージ
- 🟢 `[SUCCESS]`: 成功メッセージ  
- 🟡 `[WARNING]`: 警告メッセージ
- 🔴 `[ERROR]`: エラーメッセージ

## 📝 wxt.config.ts の例

`manifest.json` は WXT が生成します。`version` と `description` は `package.json` から、アイコンは `public/icon/` から、コンテンツスクリプトは `entrypoints/` から自動で設定されます。

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Your Extension Name',
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
    // メインロジック
  },
});
```

## 🤝 貢献

プルリクエストや Issue の報告を歓迎します。

## 📄 ライセンス

MIT License
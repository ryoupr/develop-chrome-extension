# 技術スタック

## 開発環境
- **Node.js**: `.node-version` 参照（24 LTS。22 以上で動作）
- **npm**: `package.json` の `packageManager` 参照
- **OS**: macOS / Linux

## フレームワーク
- **[WXT](https://wxt.dev/)**: Vite ベースのブラウザ拡張機能フレームワーク
  - Manifest V3 の manifest.json をエントリーポイントと `wxt.config.ts` から自動生成
  - 開発時は拡張機能を読み込んだブラウザを起動し、ホットリロード
  - `defineContentScript` / `defineBackground` / `browser` / `utils/` の export などを自動 import
- **TypeScript**（5.9 系。7 系は WXT が依存する Vite の型と非互換のため据え置き）

## 品質管理
- **[Biome](https://biomejs.dev/)**: lint とフォーマット（`biome.json`）
- **[Vitest](https://vitest.dev/)**: ユニットテスト。`WxtVitest` プラグインで `browser` API が in-memory 実装（fakeBrowser）に置き換わる
- **GitHub Actions**: CI（`ci.yml`）とリリース（`release.yml`）。自動提出は Secret `WXT_SUBMIT_ENV`（`.env.submit` の中身）を使用
- **Dependabot**: npm / GitHub Actions の更新を毎週提案

## 依存ツール（アセット用）
- **ImageMagick**: アイコン生成・スクリーンショットのリサイズ（`brew install imagemagick` / `sudo apt-get install imagemagick`）

## 主要コマンド
```bash
npm install          # 依存関係インストール（wxt prepare も実行される）
npm run setup        # 初期設定（拡張機能名・説明・対象URL・CSSプレフィックス）
npm run setup:publish # Chrome Web Store 自動提出のセットアップ（初回公開後）
npm run dev          # 開発サーバー起動（Chrome自動起動・ホットリロード）
npm run check        # lint + 型チェック + テスト
npm run lint         # Biome チェック
npm run lint:fix     # Biome で整形・自動修正
npm run compile      # 型チェック
npm run test         # テスト（npm run test:watch で監視モード）
npm run build        # .output/chrome-mv3/ にビルド
npm run zip          # Chrome Web Store用ZIPを .output/ に作成
npm run submit       # Chrome Web Store に提出（wxt submit。通常は Release ワークフローから実行）

# アイコン生成（16px, 32px, 48px, 128px → public/icon/）
./script/generate-icons.sh source-icon.png

# スクリーンショット画像を1280x800にリサイズ
./script/resize-to-1280x800.sh screenshot.png
```

## Chrome拡張機能の構成
- `wxt.config.ts`: manifest の設定（permissions, default_locale 等）
- `public/_locales/`: 表示名・説明・UI文言（ja / en）
- `package.json`: version（manifest に反映）
- `entrypoints/`: コンテンツスクリプト・background・popup 等
- `public/icon/`: アイコンファイル群

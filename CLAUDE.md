# CLAUDE.md - Chrome拡張機能開発テンプレート

## プロジェクト概要
Chrome拡張機能の開発テンプレート。ユーザーが要件を伝えたら、実装からビルドまで自律的に完了させる。

## 開発フロー

### 新規拡張機能の開発を依頼された場合
確認を挟まず自律的に完了まで進めること。

1. `manifest.json` を要件に合わせて編集（`name`, `description`, `version`, `matches`, `permissions`）
2. `content-script.js` を実装（メインロジック）
3. `styles.css` を実装（必要なスタイル）
4. 外部ライブラリが必要な場合は `lib/` に配置し、`manifest.json` に追加
5. 実装完了後、`chrome://extensions/` での動作確認手順をユーザーに提示
6. ユーザーがアイコン画像を提供したら `./script/generate-icons.sh <画像>` を実行
7. `./script/build-chrome-extension.sh` でZIPを作成

### 判断基準
- **確認不要**: manifest.json編集、コード実装、スタイル実装 → そのまま進める
- **ユーザー待ち**: アイコン画像の提供、Chrome Web Storeへのアップロード → ユーザーに依頼
- **確認必要**: 要件が曖昧で複数の解釈がある場合のみ

### 並列実行
独立したタスクは積極的に並列実行すること。
- OK: JS実装とCSS実装を同時に / manifest設定とREADME更新を同時に
- NG: manifest確定前のコード実装 / 全ファイル揃う前のビルド

## コード規約
- `content-script.js`: 即時実行関数で囲み、グローバル汚染を防ぐ
- DOM操作は `document.addEventListener('DOMContentLoaded', ...)` または `MutationObserver` を使用
- CSS クラス名にはプレフィックスを付けて既存サイトとの衝突を防ぐ（例: `myext-`）

## ビルドスクリプト
```bash
./script/generate-icons.sh source-icon.png    # アイコン一括生成
./script/build-chrome-extension.sh            # Chrome Web Store用ZIP作成
./script/resize-to-1280x800.sh image.png      # スクリーンショットリサイズ
```

## ファイル構成
- `manifest.json` - 拡張機能設定
- `content-script.js` - メインロジック
- `styles.css` - スタイルシート
- `icons/` - アイコンファイル（generate-icons.shで生成）
- `lib/` - 外部ライブラリ（オプション）
- `screenshot/` - スクリーンショット
- `script/` - ビルドスクリプト（編集不要）

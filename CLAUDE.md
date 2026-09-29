# CLAUDE.md - Chrome拡張機能開発テンプレート

WXT ベースのChrome拡張機能開発テンプレート。ユーザーが要件を伝えたら、実装からビルドまで自律的に完了させる。

## 開発フロー・コード規約
**必ず `.kiro/steering/workflow.md` を読んでから作業を開始すること。**

## コマンド
- `npm run dev` - 開発サーバー（Chrome自動起動・ホットリロード）
- `npm run check` - lint + 型チェック + テスト（完了前に必ず通す）
- `npm run lint:fix` - Biome で整形・自動修正
- `npm run build` - `.output/chrome-mv3/` にビルド
- `npm run zip` - Chrome Web Store用ZIP作成
- `./script/generate-icons.sh <画像>` - アイコン一括生成（`public/icon/`）
- `./script/resize-to-1280x800.sh <画像>` - スクリーンショットリサイズ

## ファイル構成
`.kiro/steering/structure.md` を参照。

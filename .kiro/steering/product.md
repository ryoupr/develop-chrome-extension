# プロダクト概要

## Chrome拡張機能開発ツールキット

このプロジェクトは [WXT](https://wxt.dev/) をベースにした、Chrome拡張機能の開発を効率化するためのテンプレート・ツールキットです。

### 主な機能
- WXT による TypeScript 開発・ホットリロード・manifest 自動生成
- Biome（lint / format）と Vitest（テスト）による品質管理
- GitHub Actions による CI、タグ push での GitHub Release 作成・Chrome Web Store 提出
- Chrome Web Store用のZIPパッケージング（`npm run zip`）
- 多言語対応（日本語 / 英語）の雛形
- 拡張機能用アイコンの自動生成（複数サイズ対応）
- スクリーンショット用画像のリサイズツール
- 開発からリリースまでの一貫したワークフロー

### 対象ユーザー
- Chrome拡張機能の開発者
- Chrome Web Storeへの公開を予定している開発者
- アイコンやアセット管理を自動化したい開発者

### 特徴
- 日本語ドキュメント完備
- Manifest V3 / TypeScript
- macOS / Linux / Claude Code on the web で動作
- Chrome Web Store公開要件に準拠

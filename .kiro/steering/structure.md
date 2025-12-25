# プロジェクト構造

## ディレクトリ構成

```
.
├── README.md                    # プロジェクト概要
├── .gitignore                   # Git除外設定
├── manifest.json                # Chrome拡張機能設定（作成予定）
├── content-script.js            # コンテンツスクリプト（作成予定）
├── styles.css                   # スタイルシート（作成予定）
├── icons/                       # アイコンファイル格納
│   └── .gitkeep
├── screenshot/                  # スクリーンショット格納
│   └── .gitkeep
├── lib/                         # ライブラリファイル（オプション）
└── script/                      # ビルドスクリプト
    ├── build-chrome-extension.sh
    ├── generate-icons.sh
    └── resize-to-1280x800.sh
```

## ファイル命名規則

### アイコンファイル
- `icons/icon16.png` - ファビコン用（16x16px）
- `icons/icon19.png` - ツールバー用（19x19px）
- `icons/icon32.png` - Windows表示用（32x32px）
- `icons/icon38.png` - ツールバー高解像度用（38x38px）
- `icons/icon48.png` - 拡張機能管理ページ用（48x48px）
- `icons/icon128.png` - Chrome Web Store用（128x128px）

### 出力ファイル
- `{拡張機能名}-v{バージョン}.zip` - Chrome Web Store用パッケージ
- `{ファイル名}_1280x800.png` - リサイズ済みスクリーンショット

## 開発ワークフロー

1. **初期設定**: manifest.json作成
2. **アイコン生成**: `./script/generate-icons.sh`でアイコン一括生成
3. **開発**: content-script.js, styles.css等の実装
4. **スクリーンショット**: `./script/resize-to-1280x800.sh`で画像調整
5. **パッケージング**: `./script/build-chrome-extension.sh`でZIP作成
6. **公開**: Chrome Web Store Developer Dashboardにアップロード

## 注意事項
- スクリプトはmacOS環境での実行を前提
- 一時ファイルは自動削除される
- .gitkeepファイルは自動的にパッケージから除外
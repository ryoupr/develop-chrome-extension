# プロジェクト構造

## ディレクトリ構成

```
.
├── README.md                    # プロジェクト概要
├── .gitignore                   # Git除外設定
├── .node-version                # Node.js バージョン
├── package.json                 # パッケージ名・バージョン・npmスクリプト
├── wxt.config.ts                # WXT設定（manifest の permissions 等）
├── biome.json                   # Biome設定（lint / format）
├── vitest.config.ts             # Vitest設定
├── tsconfig.json                # .wxt/tsconfig.json を継承
├── entrypoints/                 # エントリーポイント（manifest に自動反映）
│   └── content/
│       ├── index.ts             # コンテンツスクリプト
│       └── style.css            # コンテンツスクリプト用スタイル
├── utils/                       # 共通ロジック（自動 import）とテスト
│   ├── class-name.ts            # CSSクラス名のプレフィックス付与（cn）
│   └── class-name.test.ts
├── public/                      # そのまま出力にコピーされる静的ファイル
│   ├── _locales/                # 多言語メッセージ（ja / en）
│   │   ├── ja/messages.json
│   │   └── en/messages.json
│   └── icon/                    # アイコン（{16,32,48,128}.png を自動検出）
├── screenshot/                  # スクリーンショット格納
├── script/                      # セットアップ・アセット用スクリプト
│   ├── setup.mjs                # npm run setup（初期設定）
│   ├── setup-publish.mjs        # npm run setup:publish（自動提出の設定）
│   ├── *.test.mjs               # セットアップスクリプトのテスト
│   ├── generate-icons.sh        # アイコン生成（ImageMagick）
│   └── resize-to-1280x800.sh    # スクリーンショットのリサイズ（ImageMagick）
├── .github/
│   ├── workflows/
│   │   ├── ci.yml               # PR / main push: lint・型チェック・テスト・ZIP
│   │   └── release.yml          # v* タグ: GitHub Release・Chrome Web Store 提出
│   └── dependabot.yml           # 依存関係の自動更新
└── .claude/
    ├── settings.json            # Claude Code 設定（SessionStart フック）
    └── hooks/session-start.sh   # Claude Code on the web で npm install
```

### 生成物（Git管理外）
- `.wxt/` - `wxt prepare` が生成する型定義・tsconfig
- `.output/chrome-mv3/` - ビルド結果（`chrome://extensions/` で読み込むディレクトリ）
- `node_modules/`
- `.env.submit` - `npm run setup:publish`（`wxt submit init`）で作成される提出用シークレット

## ファイル命名規則

### エントリーポイント
- `entrypoints/content/index.ts` または `entrypoints/content.ts` - コンテンツスクリプト
- `entrypoints/<name>.content.ts` - 複数のコンテンツスクリプト
- `entrypoints/background.ts` - Service Worker
- `entrypoints/popup/index.html` / `options/index.html` / `sidepanel/index.html` - 各UI
- 詳細: https://wxt.dev/guide/essentials/entrypoints.html

### テスト
- `<対象ファイル>.test.ts` を対象と同じディレクトリに置く

### アイコンファイル
- `public/icon/16.png` - ファビコン・ツールバー用（16x16px）
- `public/icon/32.png` - Windows表示用（32x32px）
- `public/icon/48.png` - 拡張機能管理ページ用（48x48px）
- `public/icon/128.png` - Chrome Web Store用（128x128px）

### 出力ファイル
- `.output/{package.jsonのname}-{version}-chrome.zip` - Chrome Web Store用パッケージ
- `{ファイル名}_1280x800.png` - リサイズ済みスクリーンショット

## 注意事項
- 開発ワークフローの詳細は `workflow.md` を参照
- `manifest.json` は直接置かない（WXT が生成する）

# Chrome拡張機能 開発ワークフロー

## テンプレートリポジトリ
- https://github.com/ryoupr/develop-chrome-extension
- 新しい拡張機能を作る際は「Use this template」から新リポジトリを作成する

## 開発フロー

### Phase 1: プロジェクト作成
1. GitHubで「Use this template」→ 新リポジトリ作成（命名: 拡張機能の機能を表す名前）
2. `git clone` してローカルに取得
3. `manifest.json` を編集:
   - `name`: 拡張機能名
   - `description`: 説明文
   - `matches`: 対象URL（`<all_urls>` or 特定ドメイン）
   - `permissions`: 必要な権限

### Phase 2: 実装
1. `content-script.js` にメインロジックを実装
2. `styles.css` にスタイルを実装
3. 外部ライブラリが必要な場合は `lib/` に配置し、`manifest.json` の `js` 配列に追加
4. Chrome で動作確認: `chrome://extensions/` → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」

### Phase 3: アセット準備
```bash
# アイコン生成（128px以上の正方形PNG画像を用意）
./script/generate-icons.sh source-icon.png

# スクリーンショット撮影後、Chrome Web Store用にリサイズ
./script/resize-to-1280x800.sh screenshot/*.png
```

### Phase 4: ビルド & 公開
```bash
# Chrome Web Store用ZIPを作成
./script/build-chrome-extension.sh
```
- 生成された `{name}-v{version}.zip` を Chrome Web Store Developer Dashboard にアップロード
- URL: https://chrome.google.com/webstore/devconsole/

### Phase 5: バージョンアップ
1. `manifest.json` の `version` をインクリメント
2. 変更を実装・テスト
3. `./script/build-chrome-extension.sh` で再ビルド
4. Developer Dashboard で新バージョンをアップロード

## Agent向け指示

### 新規拡張機能の開発を依頼された場合
1. ユーザーに「Use this template」でリポジトリ作成を依頼
2. clone後、まず `manifest.json` の `name`, `description`, `matches` を要件に合わせて編集
3. `content-script.js` と `styles.css` を実装
4. 動作確認手順をユーザーに提示（chrome://extensions/ での読み込み方法）
5. 完成後、ビルドコマンドを実行

### コード規約
- `content-script.js`: 即時実行関数で囲み、グローバル汚染を防ぐ
- DOM操作は `document.addEventListener('DOMContentLoaded', ...)` または `MutationObserver` を使用
- CSS クラス名にはプレフィックスを付けて既存サイトとの衝突を防ぐ（例: `myext-`）

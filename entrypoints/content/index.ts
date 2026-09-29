import './style.css';

export default defineContentScript({
  matches: ['https://example.com/*'],
  runAt: 'document_end',
  main() {
    // このファイルにChrome拡張機能のメインロジックを実装してください
    // 追加する要素のクラス名は cn('button') → 'myext-button' のようにプレフィックスを付ける
  },
});

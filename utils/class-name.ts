/** 既存サイトとの衝突を防ぐため、拡張機能が追加する要素のクラス名に付けるプレフィックス */
export const CLASS_PREFIX = 'myext-';

/** プレフィックス付きのクラス名を返す（例: cn('button') → 'myext-button'） */
export function cn(name: string): string {
  return `${CLASS_PREFIX}${name}`;
}

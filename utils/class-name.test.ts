import { describe, expect, it } from 'vitest';
import { CLASS_PREFIX, cn } from './class-name';

describe('cn', () => {
  it('クラス名にプレフィックスを付ける', () => {
    expect(cn('button')).toBe(`${CLASS_PREFIX}button`);
  });
});

import { describe, expect, it } from 'vitest';
import {
  defaultEnglish,
  defaultPrefix,
  normalizePrefix,
  parseMatches,
  readMatches,
  readPrefix,
  toPackageName,
  updateMatches,
  updateMessages,
  updatePackageLock,
  updatePrefix,
  validateDescription,
  validateMatches,
  validateName,
  validatePackageName,
  validatePrefix,
} from './setup.mjs';

describe('toPackageName', () => {
  it('英数字以外をハイフンにして小文字にする', () => {
    expect(toPackageName('Tab Saver Pro!')).toBe('tab-saver-pro');
  });

  it('英数字を含まない名前は空文字になる', () => {
    expect(toPackageName('タブ保存')).toBe('');
  });
});

describe('prefix', () => {
  it('パッケージ名からプレフィックスを作る', () => {
    expect(defaultPrefix('tab-saver')).toBe('tabsaver-');
    expect(defaultPrefix('123')).toBe('myext-');
  });

  it('末尾にハイフンを補う', () => {
    expect(normalizePrefix('Abc')).toBe('abc-');
    expect(normalizePrefix('abc-')).toBe('abc-');
  });

  it('CSSクラス名として使えない値を拒否する', () => {
    expect(validatePrefix('abc-')).toBeNull();
    expect(validatePrefix('1abc-')).not.toBeNull();
    expect(validatePrefix('a b-')).not.toBeNull();
  });
});

describe('matches', () => {
  it('カンマ・空白区切りで分割する', () => {
    expect(parseMatches('https://a.com/*, https://b.com/*  https://c.com/x')).toEqual([
      'https://a.com/*',
      'https://b.com/*',
      'https://c.com/x',
    ]);
  });

  it.each([
    '<all_urls>',
    'https://example.com/*',
    '*://*.example.com/*',
    'http://localhost:3000/*',
    'file:///*',
  ])('正しいパターン: %s', (pattern) => {
    expect(validateMatches([pattern])).toBeNull();
  });

  it.each([
    'example.com',
    'https://example.com',
    'https://exa*mple.com/*',
    "https://example.com/'*",
  ])('誤ったパターン: %s', (pattern) => {
    expect(validateMatches([pattern])).not.toBeNull();
  });

  it('空の配列を拒否する', () => {
    expect(validateMatches([])).not.toBeNull();
  });

  it('コンテンツスクリプトの matches を読み書きする', () => {
    const source =
      "export default defineContentScript({\n  matches: ['https://example.com/*'],\n});\n";
    const updated = updateMatches(source, ['https://a.com/*', '*://b.com/*']);
    expect(updated).toContain("matches: ['https://a.com/*', '*://b.com/*'],");
    expect(readMatches(updated)).toEqual(['https://a.com/*', '*://b.com/*']);
  });

  it('matches が無ければエラーにする', () => {
    expect(() => updateMatches('export default {};', ['https://a.com/*'])).toThrow();
  });
});

describe('validate', () => {
  it('名前は必須・75文字以内', () => {
    expect(validateName('拡張')).toBeNull();
    expect(validateName(' ')).not.toBeNull();
    expect(validateName('あ'.repeat(76))).not.toBeNull();
  });

  it('説明は132文字以内', () => {
    expect(validateDescription('あ'.repeat(132))).toBeNull();
    expect(validateDescription('あ'.repeat(133))).not.toBeNull();
  });

  it('パッケージ名は kebab-case', () => {
    expect(validatePackageName('tab-saver')).toBeNull();
    expect(validatePackageName('Tab Saver')).not.toBeNull();
    expect(validatePackageName('-tab')).not.toBeNull();
  });
});

describe('ファイル更新', () => {
  it('messages.json の他のキーを残して名前と説明を更新する', () => {
    const json = JSON.stringify({
      extName: { message: 'Old', description: 'note' },
      extDescription: { message: 'Old desc' },
      greeting: { message: 'Hello' },
    });
    const updated = JSON.parse(updateMessages(json, { name: 'New', description: 'New desc' }));
    expect(updated).toEqual({
      extName: { message: 'New', description: 'note' },
      extDescription: { message: 'New desc' },
      greeting: { message: 'Hello' },
    });
  });

  it('package-lock.json のルートの name を更新する', () => {
    const json = JSON.stringify({
      name: 'old',
      packages: { '': { name: 'old' }, 'node_modules/x': { name: 'x' } },
    });
    const updated = JSON.parse(updatePackageLock(json, 'new'));
    expect(updated.name).toBe('new');
    expect(updated.packages[''].name).toBe('new');
    expect(updated.packages['node_modules/x'].name).toBe('x');
  });

  it('CLASS_PREFIX を読み書きする', () => {
    const source = "export const CLASS_PREFIX = 'myext-';\n";
    const updated = updatePrefix(source, 'tab-');
    expect(readPrefix(updated)).toBe('tab-');
  });
});

describe('defaultEnglish', () => {
  it('テンプレートのままなら日本語の値に追従する', () => {
    expect(defaultEnglish('My Extension', 'My Extension', 'タブ保存')).toBe('タブ保存');
    expect(defaultEnglish('Description of the Chrome extension', '説明', '新しい説明')).toBe(
      '新しい説明',
    );
  });

  it('変更済みの英語はそのまま残す', () => {
    expect(defaultEnglish('Tab Saver', 'タブ保存', 'タブ保存 Pro')).toBe('Tab Saver');
  });
});

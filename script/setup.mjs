#!/usr/bin/env node
// テンプレートから作成したリポジトリの初期設定
// 拡張機能名・説明・パッケージ名・対象URL・CSSクラスのプレフィックスを一括で書き換える
//
// 対話形式:   npm run setup
// 引数指定:   npm run setup -- --yes --name "拡張機能名" --matches "https://example.com/*"

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const FILES = {
  messagesJa: 'public/_locales/ja/messages.json',
  messagesEn: 'public/_locales/en/messages.json',
  packageJson: 'package.json',
  packageLock: 'package-lock.json',
  contentScript: 'entrypoints/content/index.ts',
  className: 'utils/class-name.ts',
};

// テンプレートのままの英語文言（未変更なら日本語の入力値を初期値にする）
const EN_PLACEHOLDERS = new Set(['My Extension', 'Description of the Chrome extension']);

const MATCHES_RE = /matches:\s*\[[^\]]*\]/;
const PREFIX_RE = /export const CLASS_PREFIX = '([^']*)';/;
const MATCH_PATTERN_RE =
  /^(?:<all_urls>|(?:\*|https?|wss?|ftp):\/\/(?:\*|(?:\*\.)?[^/*:\s]+)(?::\d+)?\/[^\s'"\\]*|file:\/\/\/[^\s'"\\]*)$/;

const HELP = `使い方: npm run setup [-- オプション]

テンプレートの初期設定（拡張機能名・対象URL等）を一括で書き換えます。
オプションを省略した項目は、対話形式で質問します（--yes の場合は現在の値のまま）。

オプション:
  --name <名前>              拡張機能名（日本語 / 75文字以内）
  --name-en <名前>           拡張機能名（英語。省略時は日本語と同じ）
  --description <説明>       説明（日本語 / 132文字以内）
  --description-en <説明>    説明（英語。省略時は日本語と同じ）
  --package <名前>           package.json の name（ZIPのファイル名。kebab-case）
  --matches <パターン>       対象URL（カンマ区切りで複数可。例: "https://example.com/*"）
  --prefix <接頭辞>          CSSクラス名のプレフィックス（例: myext-）
  -y, --yes                  確認せずに書き換える（質問もしない）
  -h, --help                 このヘルプを表示
`;

// ---- 変換・検証（テスト対象） ----

/** 拡張機能名から package.json の name を作る（英数字以外は - に置換） */
export function toPackageName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** package.json の name から CSS クラスのプレフィックスを作る */
export function defaultPrefix(packageName) {
  const base = packageName.replace(/[^a-z0-9]/g, '').replace(/^[0-9]+/, '');
  return base ? `${base.slice(0, 12)}-` : 'myext-';
}

/** 末尾の - を補い、小文字にする */
export function normalizePrefix(prefix) {
  const trimmed = prefix.trim().toLowerCase();
  return trimmed.endsWith('-') ? trimmed : `${trimmed}-`;
}

/** カンマ・空白区切りのURLパターンを配列にする */
export function parseMatches(input) {
  return input
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function validateName(name) {
  if (!name.trim()) return '拡張機能名を入力してください';
  if ([...name].length > 75) return '拡張機能名は75文字以内にしてください';
  return null;
}

export function validateDescription(description) {
  if ([...description].length > 132) return '説明は132文字以内にしてください';
  return null;
}

export function validatePackageName(packageName) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(packageName)) {
    return 'パッケージ名は英小文字・数字・ハイフンのみで指定してください（例: my-extension）';
  }
  if (packageName.length > 214) return 'パッケージ名は214文字以内にしてください';
  return null;
}

export function validateMatches(matches) {
  if (matches.length === 0) return '対象URLを1つ以上指定してください';
  const invalid = matches.filter((m) => !MATCH_PATTERN_RE.test(m));
  if (invalid.length > 0) {
    return `URLパターンの形式が正しくありません: ${invalid.join(', ')}（例: https://example.com/*）`;
  }
  return null;
}

export function validatePrefix(prefix) {
  if (!/^[a-z][a-z0-9-]*-$/.test(prefix)) {
    return 'プレフィックスは英小文字で始まり、英小文字・数字・ハイフンのみにしてください（例: myext-）';
  }
  return null;
}

function toJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function updateMessages(json, { name, description }) {
  const messages = JSON.parse(json);
  messages.extName = { ...messages.extName, message: name };
  messages.extDescription = { ...messages.extDescription, message: description };
  return toJson(messages);
}

export function updatePackageJson(json, { packageName, description }) {
  const pkg = JSON.parse(json);
  pkg.name = packageName;
  pkg.description = description;
  return toJson(pkg);
}

export function updatePackageLock(json, packageName) {
  const lock = JSON.parse(json);
  lock.name = packageName;
  if (lock.packages?.['']) lock.packages[''].name = packageName;
  return toJson(lock);
}

export function readMatches(source) {
  const match = MATCHES_RE.exec(source);
  if (!match) return null;
  return [...match[0].matchAll(/'([^']*)'|"([^"]*)"/g)].map((m) => m[1] ?? m[2]);
}

export function updateMatches(source, matches) {
  if (!MATCHES_RE.test(source)) {
    throw new Error(`${FILES.contentScript} に matches: [...] が見つかりません`);
  }
  const list = matches.map((m) => `'${m}'`).join(', ');
  return source.replace(MATCHES_RE, `matches: [${list}]`);
}

export function readPrefix(source) {
  return PREFIX_RE.exec(source)?.[1] ?? null;
}

export function updatePrefix(source, prefix) {
  if (!PREFIX_RE.test(source)) {
    throw new Error(`${FILES.className} に CLASS_PREFIX が見つかりません`);
  }
  return source.replace(PREFIX_RE, `export const CLASS_PREFIX = '${prefix}';`);
}

/** 英語の初期値: テンプレートのまま（または日本語と同じ）なら日本語の値に追従させる */
export function defaultEnglish(currentEn, currentJa, nextJa) {
  return EN_PLACEHOLDERS.has(currentEn) || currentEn === currentJa ? nextJa : currentEn;
}

// ---- 実行 ----

async function read(file) {
  return readFile(path.join(ROOT, file), 'utf8');
}

async function write(file, content) {
  await writeFile(path.join(ROOT, file), content, 'utf8');
}

async function loadCurrent() {
  const ja = JSON.parse(await read(FILES.messagesJa));
  const en = JSON.parse(await read(FILES.messagesEn));
  const pkg = JSON.parse(await read(FILES.packageJson));
  return {
    name: ja.extName?.message ?? '',
    nameEn: en.extName?.message ?? '',
    description: ja.extDescription?.message ?? '',
    descriptionEn: en.extDescription?.message ?? '',
    packageName: pkg.name ?? '',
    matches: readMatches(await read(FILES.contentScript)) ?? [],
    prefix: readPrefix(await read(FILES.className)) ?? '',
  };
}

function createAsker(interactive) {
  const rl = interactive ? createInterface({ input: stdin, output: stdout }) : null;
  return {
    /** 値が指定済みならそれを、対話モードなら入力を、それ以外は初期値を返す（検証に通るまで再入力） */
    async ask(label, { given, fallback, validate = () => null, transform = (v) => v }) {
      if (given !== undefined || !rl) {
        const value = transform(given ?? fallback);
        const error = validate(value);
        if (error) throw new Error(`${label}: ${error}`);
        return value;
      }
      for (;;) {
        const answer = (await rl.question(`${label} [${fallback}]: `)).trim();
        const value = transform(answer || fallback);
        const error = validate(value);
        if (!error) return value;
        console.log(`  ✗ ${error}`);
      }
    },
    async confirm(message) {
      if (!rl) return true;
      const answer = (await rl.question(`${message} (y/N): `)).trim().toLowerCase();
      return answer === 'y' || answer === 'yes';
    },
    close() {
      rl?.close();
    },
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      'name-en': { type: 'string' },
      description: { type: 'string' },
      'description-en': { type: 'string' },
      package: { type: 'string' },
      matches: { type: 'string' },
      prefix: { type: 'string' },
      yes: { type: 'boolean', short: 'y', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) {
    console.log(HELP);
    return;
  }

  const current = await loadCurrent();
  const interactive = stdin.isTTY && !values.yes;
  const asker = createAsker(interactive);

  try {
    if (interactive) {
      console.log(
        'Chrome拡張機能の初期設定を行います。[ ] 内の値は Enter でそのまま使われます。\n',
      );
    }

    const name = await asker.ask('拡張機能名（日本語）', {
      given: values.name,
      fallback: current.name,
      validate: validateName,
    });
    const nameEn = await asker.ask('拡張機能名（英語）', {
      given: values['name-en'],
      fallback: defaultEnglish(current.nameEn, current.name, name),
      validate: validateName,
    });
    const description = await asker.ask('説明（日本語）', {
      given: values.description,
      fallback: current.description,
      validate: validateDescription,
    });
    const descriptionEn = await asker.ask('説明（英語）', {
      given: values['description-en'],
      fallback: defaultEnglish(current.descriptionEn, current.description, description),
      validate: validateDescription,
    });
    const nameChanged = name !== current.name;
    const packageName = await asker.ask('パッケージ名（ZIPのファイル名）', {
      given: values.package,
      fallback: (nameChanged && toPackageName(nameEn)) || current.packageName,
      validate: validatePackageName,
    });
    const matches = await asker.ask('対象URL（カンマ区切り）', {
      given: values.matches,
      fallback: current.matches.join(', '),
      validate: validateMatches,
      transform: parseMatches,
    });
    const prefix = await asker.ask('CSSクラスのプレフィックス', {
      given: values.prefix,
      fallback: packageName !== current.packageName ? defaultPrefix(packageName) : current.prefix,
      validate: validatePrefix,
      transform: normalizePrefix,
    });

    const summary = [
      ['拡張機能名', `${name} / ${nameEn}`],
      ['説明', `${description} / ${descriptionEn}`],
      ['パッケージ名', packageName],
      ['対象URL', matches.join(', ')],
      ['プレフィックス', prefix],
    ];
    console.log('\n以下の内容で書き換えます:');
    for (const [label, value] of summary) console.log(`  ${label}: ${value}`);
    if (!(await asker.confirm('\nよろしいですか？'))) {
      console.log('中止しました。ファイルは変更していません。');
      return;
    }

    const updates = [
      [FILES.messagesJa, updateMessages(await read(FILES.messagesJa), { name, description })],
      [
        FILES.messagesEn,
        updateMessages(await read(FILES.messagesEn), {
          name: nameEn,
          description: descriptionEn,
        }),
      ],
      [
        FILES.packageJson,
        updatePackageJson(await read(FILES.packageJson), { packageName, description }),
      ],
      [FILES.packageLock, updatePackageLock(await read(FILES.packageLock), packageName)],
      [FILES.contentScript, updateMatches(await read(FILES.contentScript), matches)],
      [FILES.className, updatePrefix(await read(FILES.className), prefix)],
    ];
    for (const [file, content] of updates) {
      await write(file, content);
      console.log(`  ✓ ${file}`);
    }

    console.log('\n初期設定が完了しました。次のステップ:');
    console.log('  1. wxt.config.ts に必要な permissions を追加');
    console.log('  2. entrypoints/content/index.ts にロジックを実装');
    console.log('  3. npm run dev で動作確認、npm run check でチェック');
  } finally {
    asker.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(`[ERROR] ${error.message}`);
    process.exitCode = 1;
  });
}

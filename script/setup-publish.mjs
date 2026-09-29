#!/usr/bin/env node
// Chrome Web Store 自動提出のセットアップ（ストアへの初回公開後に実行）
// 1. wxt submit init で .env.submit を作成（対話形式）
// 2. wxt submit --dry-run で認証を確認
// 3. .env.submit の内容を GitHub Secret（WXT_SUBMIT_ENV）に登録
//
// 使い方: npm run setup:publish [-- --skip-init --skip-dry-run --repo owner/repo]

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs, parseEnv } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = '.env.submit';

export const SECRET_NAME = 'WXT_SUBMIT_ENV';

export const REQUIRED_KEYS = [
  'CHROME_EXTENSION_ID',
  'CHROME_PUBLISHER_ID',
  'CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL',
  'CHROME_SERVICE_ACCOUNT_PRIVATE_KEY',
];

const HELP = `使い方: npm run setup:publish [-- オプション]

Chrome Web Store への自動提出をセットアップします（ストアへの初回公開後に実行）。
  1. wxt submit init で ${ENV_FILE} を作成（Chrome Web Store を選択し、API は v2 を選ぶ）
  2. wxt submit --dry-run で認証を確認
  3. ${ENV_FILE} の内容を GitHub Secret「${SECRET_NAME}」に登録（GitHub CLI を使用）

オプション:
  --skip-init       ${ENV_FILE} を作り直さずに使う
  --skip-dry-run    認証確認を省略する
  --repo <o/r>      Secret を登録するリポジトリ（省略時は現在のリポジトリ）
  -h, --help        このヘルプを表示
`;

// ---- 検証（テスト対象） ----

/** .env.submit の内容を検証し、問題点の一覧を返す（空なら OK） */
export function validateSubmitEnv(content) {
  const env = parseEnv(content);
  const errors = [];
  if (env.CHROME_API_VERSION !== 'v2') {
    errors.push(
      `CHROME_API_VERSION が v2 ではありません（現在: ${env.CHROME_API_VERSION ?? '未設定'}）。wxt submit init で v2 を選んでください`,
    );
  }
  const missing = REQUIRED_KEYS.filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    errors.push(`未設定の項目があります: ${missing.join(', ')}`);
  }
  const key = env.CHROME_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (key && !/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(key)) {
    errors.push(
      'CHROME_SERVICE_ACCOUNT_PRIVATE_KEY が秘密鍵の形式ではありません（JSON の private_key の値を入力してください）',
    );
  }
  return errors;
}

// ---- 実行 ----

function print(level, message) {
  const colors = { INFO: 34, SUCCESS: 32, WARNING: 33, ERROR: 31 };
  console.log(`\x1b[${colors[level]}m[${level}]\x1b[0m ${message}`);
}

function run(command, args, options = {}) {
  return spawnSync(command, args, { cwd: ROOT, stdio: 'inherit', ...options });
}

function capture(command, args) {
  const result = run(command, args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

function printManualSecretSteps() {
  print('INFO', '手動で登録する場合は、以下のどちらかを行ってください:');
  console.log(`  - gh secret set ${SECRET_NAME} < ${ENV_FILE}`);
  console.log(
    `  - GitHub の Settings → Secrets and variables → Actions → New repository secret で、名前「${SECRET_NAME}」、値に ${ENV_FILE} の中身をそのまま貼り付け`,
  );
}

async function main() {
  const { values } = parseArgs({
    options: {
      'skip-init': { type: 'boolean', default: false },
      'skip-dry-run': { type: 'boolean', default: false },
      repo: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) {
    console.log(HELP);
    return;
  }

  const envPath = path.join(ROOT, ENV_FILE);
  const interactive = Boolean(stdin.isTTY);
  // 子プロセス（wxt submit init）の対話入力と競合しないよう、質問のたびに開いて閉じる
  const confirm = async (message, defaultYes) => {
    if (!interactive) return defaultYes;
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      const answer = (await rl.question(`${message} (${defaultYes ? 'Y/n' : 'y/N'}): `))
        .trim()
        .toLowerCase();
      return answer ? answer === 'y' || answer === 'yes' : defaultYes;
    } finally {
      rl.close();
    }
  };

  // 1. .env.submit の作成
  const exists = existsSync(envPath);
  const shouldInit =
    !values['skip-init'] &&
    (!exists || (await confirm(`${ENV_FILE} が既にあります。作り直しますか？`, false)));
  if (shouldInit) {
    if (!interactive)
      throw new Error(`${ENV_FILE} の作成は対話形式のため、ターミナルで実行してください`);
    print('INFO', 'wxt submit init を実行します。');
    console.log('  - 設定するストアは「Chrome Web Store」を選択');
    console.log('  - CHROME_API_VERSION は「v2 (recommended)」を選択');
    console.log(
      '  - サービスアカウントの作成手順: https://developer.chrome.com/docs/webstore/service-accounts\n',
    );
    const result = run('npx', ['wxt', 'submit', 'init']);
    if (result.status !== 0) throw new Error('wxt submit init が失敗しました');
  } else if (!exists) {
    throw new Error(`${ENV_FILE} がありません。--skip-init を外して実行してください`);
  }

  const content = readFileSync(envPath, 'utf8');
  const errors = validateSubmitEnv(content);
  if (errors.length > 0) {
    for (const error of errors) print('ERROR', error);
    throw new Error(
      `${ENV_FILE} の内容を修正してから再実行してください（--skip-init で再検証のみ）`,
    );
  }
  print('SUCCESS', `${ENV_FILE} の内容を確認しました`);

  // 2. 認証の確認
  if (!values['skip-dry-run']) {
    print('INFO', 'ZIP を作成し、wxt submit --dry-run で認証を確認します...');
    if (run('npm', ['run', 'zip']).status !== 0) throw new Error('npm run zip が失敗しました');
    const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const zip = `.output/${pkg.name}-${pkg.version}-chrome.zip`;
    const result = run('npx', ['wxt', 'submit', '--dry-run', '--chrome-zip', zip]);
    if (result.status !== 0) {
      throw new Error(`認証に失敗しました。${ENV_FILE} の値を確認してください`);
    }
    print('SUCCESS', '認証を確認しました');
  }

  // 3. GitHub Secret の登録
  if (!capture('gh', ['--version'])) {
    print(
      'WARNING',
      'GitHub CLI（gh）が見つかりません。https://cli.github.com/ からインストールできます',
    );
    printManualSecretSteps();
    return;
  }
  if (capture('gh', ['auth', 'status']) === null) {
    print('WARNING', 'GitHub CLI にログインしていません（gh auth login でログインできます）');
    printManualSecretSteps();
    return;
  }
  const repo =
    values.repo ??
    capture('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']);
  if (!repo) {
    print('WARNING', 'リポジトリを特定できませんでした（--repo owner/repo で指定できます）');
    printManualSecretSteps();
    return;
  }
  if (!(await confirm(`${repo} に Secret「${SECRET_NAME}」を登録しますか？`, true))) {
    printManualSecretSteps();
    return;
  }
  const result = run('gh', ['secret', 'set', SECRET_NAME, '--repo', repo], {
    input: content,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  if (result.status !== 0) throw new Error('Secret の登録に失敗しました');
  print('SUCCESS', `${repo} に Secret「${SECRET_NAME}」を登録しました`);

  console.log('\n次のステップ:');
  console.log(
    '  - GitHub の Actions タブで「Release」を手動実行すると、dry-run で CI からの認証を確認できます',
  );
  console.log(
    '  - npm version patch && git push --follow-tags でリリースすると、自動で提出されます',
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    print('ERROR', error.message);
    process.exitCode = 1;
  });
}

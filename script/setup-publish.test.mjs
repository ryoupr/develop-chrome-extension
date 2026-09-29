import { describe, expect, it } from 'vitest';
import { validateSubmitEnv } from './setup-publish.mjs';

const PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIE\nabcd\n-----END PRIVATE KEY-----';

function envFile(overrides = {}) {
  const values = {
    CHROME_API_VERSION: 'v2',
    CHROME_EXTENSION_ID: 'abcdefghijklmnop',
    CHROME_PUBLISHER_ID: 'publisher',
    CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL: 'sa@example.iam.gserviceaccount.com',
    CHROME_SERVICE_ACCOUNT_PRIVATE_KEY: `"${PRIVATE_KEY}"`,
    ...overrides,
  };
  return Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

describe('validateSubmitEnv', () => {
  it('wxt submit init が書き出す形式（複数行の秘密鍵）を受け付ける', () => {
    expect(validateSubmitEnv(envFile())).toEqual([]);
  });

  it('API v1.1 を拒否する', () => {
    expect(validateSubmitEnv(envFile({ CHROME_API_VERSION: 'v1.1' }))).toHaveLength(1);
  });

  it('未設定の項目を列挙する', () => {
    const errors = validateSubmitEnv(
      envFile({ CHROME_PUBLISHER_ID: undefined, CHROME_EXTENSION_ID: '' }),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('CHROME_EXTENSION_ID');
    expect(errors[0]).toContain('CHROME_PUBLISHER_ID');
  });

  it('秘密鍵の形式でない値を拒否する', () => {
    expect(
      validateSubmitEnv(envFile({ CHROME_SERVICE_ACCOUNT_PRIVATE_KEY: 'not-a-key' })),
    ).toHaveLength(1);
  });
});

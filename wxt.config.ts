import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    // 表示名と説明は public/_locales/<言語>/messages.json で管理する
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'ja',
    permissions: [],
  },
});

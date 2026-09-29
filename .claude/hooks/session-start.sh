#!/bin/bash
# Claude Code on the web のセッション開始時に依存関係をインストールする
# （npm install の postinstall で wxt prepare も実行され、型定義が生成される）
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
npm install --no-audit --no-fund

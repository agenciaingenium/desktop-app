#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

search() {
  local pattern="$1"
  shift

  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" "$@"
  else
    grep -nER "$pattern" "$@"
  fi
}

echo "[pre-release-check] Environment"
echo "node: $(node -v)"
echo "yarn: $(yarn -v)"
echo "electron: $(node -e "console.log(require('./packages/app/package.json').devDependencies.electron)")"

TEST_CMD="yarn workspace station-desktop-app test \
  test/jest/session/test-session.ts \
  test/jest/session/test-session-browserwindow.ts \
  test/jest/tab-webcontents/test-webcontents-to-kill.ts \
  test/jest/url-router/test-url-router.ts"

if [[ "${CI:-}" == "true" ]] && [[ "$(uname -s)" == "Linux" ]]; then
  export ELECTRON_DISABLE_SANDBOX=1
  export ELECTRON_NO_SANDBOX=1
  echo "[pre-release-check] Linux CI detected: running Electron tests with sandbox disabled"

  if command -v xvfb-run >/dev/null 2>&1; then
    TEST_CMD="xvfb-run -a ${TEST_CMD}"
    echo "[pre-release-check] Linux CI detected: running Electron tests with xvfb-run"
  else
    echo "[pre-release-check] WARNING: xvfb-run not found; Electron tests may fail without DISPLAY"
  fi
fi

echo "[pre-release-check] Running critical stability tests"
eval "${TEST_CMD}"

echo "[pre-release-check] Running scoped TypeScript stability check"
yarn workspace station-desktop-app run typecheck:stability

echo "[pre-release-check] Checking for known risky hardcodes"
if search "bx_override_user_agent" packages/app/manifests/definitions; then
  echo "[pre-release-check] ERROR: Found bx_override_user_agent in manifests."
  exit 1
fi

if search "Chrome/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" \
  packages/app/src/session.ts \
  packages/app/manifests/definitions; then
  echo "[pre-release-check] ERROR: Found hardcoded Chrome version."
  exit 1
fi

if search "targets:\s*\{\s*electron:\s*'?[0-9]+'?\s*\}" packages/app/webpack.config.base.js; then
  echo "[pre-release-check] ERROR: Found hardcoded webpack Electron target."
  exit 1
fi

echo "[pre-release-check] Verifying About window exposes runtime versions"
if ! search "process\\.versions\\.electron|process\\.versions\\.chrome" \
  packages/app/src/about-window/components/AboutWindowVersions.tsx >/dev/null; then
  echo "[pre-release-check] ERROR: About window does not expose Electron/Chromium versions."
  exit 1
fi

echo "[pre-release-check] OK"

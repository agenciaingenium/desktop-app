# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Station is an Electron-based desktop application that runs web apps in isolated windows. It's a monorepo with 3 workspaces: `app` (main Electron renderer/main processes), `appstore` (app marketplace), and `sdk` (browser extension SDK).

## Build Commands

```bash
yarn dev          # Start development mode (renderer dev server + main build)
yarn build        # Production build (all entry points)
yarn release      # Build + package for distribution (electron-builder)
yarn test         # Run Jest tests
yarn lint         # Lint all workspaces
yarn pre-release:check  # Run checks before release (lint, typecheck, tests)
```

## Architecture

### Electron Multi-Process Model
- **Main process**: `packages/app/src/main.ts` - window management, IPC handlers, native APIs
- **Renderer processes**: 4 entry points in `packages/app/src/`
  - `index.js` - main application window
  - `index-sub.js` - sub-windows (application containers)
  - `about-window/about.js` - about dialog
  - Multi-instance configuration window
- **Worker process**: `packages/app/src/app-worker.ts` - redux store, sagas, IPC routing
- **Preload scripts**: `preload-api.js` exposes `window.station.*` APIs via contextBridge

### Redux Architecture
- Immutable.js state with custom `RecursiveImmutableMap` types
- Redux-saga for side effects (26 saga files in `src/*/sagas.ts`)
- `redux-ui-compat.ts` provides drop-in replacement for redux-ui UPDATE_UI_STATE
- State persistence via `redux-persist` + SQLite (sequelize)

### IPC Communication
- Main ↔ Renderer: `ipc-redux-sync.ts` (IPC-based Redux action forwarding)
- Main → Renderer: `window.station.ipc.send()`
- Renderer → Main: `window.station.ipc.invoke()`
- Channels defined in `preload-api.js`

### Key Services
- `services/servicesManager.ts` - registers all services with `@service` decorator
- Services use `serviceAddObserverChannel` to bridge Electron events to sagas
- Auto-update via `electron-updater`

### Webpack 5 Configuration
- Standalone configs: `webpack.config.base.5.js`, `main.5.js`, `renderer.5.js`, `webui`
- Renderer target: `web` (not `electron-renderer`) with Node.js polyfills
- All IPC-based APIs exposed via `contextBridge.exposeInMainWorld`

## Important Notes

- TypeScript strict mode is NOT enabled due to ~578 existing type errors
- 19 persistence test suites fail due to Sequelize transaction conflicts (known issue)
- `redux-saga-test-plan` sets transactions that conflict when tests run in parallel
- Loading screen exists in main window; `index-sub.js` now includes it too
- Offline banner shows when `navigator.onLine` is false
- App uses `shared-redux` pattern replaced with IPC-based sync

## Environment Variables

```bash
STATION_NO_WEBVIEWS=1     # Skip webview loading (dev)
STATION_REDUX_LOGGER=1     # Enable redux-logger
STATION_REACT_PERF=1       # Enable react-addons-perf
STATION_NO_CHECK_FOR_UPDATE=1  # Disable auto-update check
DEBUG=service:*            # Debug service framework
```

## Code Signing

macOS code signing is configured via GitHub Actions secrets (`CSC_LINK`, `CSC_KEY_PASSWORD`, etc.) and runs in CI on release builds.
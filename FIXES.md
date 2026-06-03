# Station Desktop App — Build & Fix Notes (b11)

## Quick Start

```bash
# Build + release (macOS arm64 only, auto-installs to /Applications)
yarn build && yarn release

# Clear all data for a fresh test
rm -rf ~/Library/Application\ Support/Station* && \
rm -rf ~/Library/Application\ Support/StationTest*
```

User data dir is hardcoded to `Stationv2` in `packages/app/src/main.ts:151` (when packaged).

## Architecture Overview

```
Renderer (main window)
  └─ Apollo Client (with ServicesLink → IPC)
     └─ Worker process (hidden BrowserWindow)
        └─ ReactiveSchemaLink (reactive-graphql)
           └─ Local resolvers + InMemoryCache
```

- **Main process**: `packages/app/src/main.ts` — window management, IPC proxy
- **Worker process**: `packages/app/src/app-worker.ts` — Apollo schema, resolvers, sagas
- **Renderer process**: `packages/app/src/index.js` — React UI, Apollo Client
- **GraphQL schema**: `packages/app/src/graphql/schema.graphql`
- **Resolvers**: `packages/app/src/applications/resolvers.ts` and similar
- **IPC**: `packages/app/src/services/services/apollo-link/worker.ts`

## Critical Fixes Applied

### 1. Umzug migrations fail inside asar
**File**: `packages/app/src/persistence/umzug.ts`
**Problem**: `globby` can't read inside `.asar` (ENOTDIR), so no migrations ran → empty DB.
**Fix**: Replaced runtime glob with webpack `require.context` to bundle all migration files at build time.

### 2. `getApplicationById` resolver throws when app not found
**File**: `packages/app/src/applications/resolvers.ts`
**Problem**: Throwing inside reactive-graphql Observable kills the `combineLatest` chain for the ENTIRE query, hanging it forever.
**Fix**: Use `filter()` to skip null emissions — Observable stays alive, re-emits when app appears.

### 3. `ListProxyMixin.createAll` calls nonexistent `mapStateToObject`
**File**: `packages/app/src/persistence/mixins.ts`
**Problem**: Copied from `KeyValueProxyMixin` which has `mapStateToObject`; `ListProxyMixin` only has `mapStateToArray`. `SingletonProxy.mapStateToObject` throws "Unimplement method", blocking redux-persist rehydration and breaking onboarding.
**Fix**: Use `mapStateToArray` which ListProxyMixin actually defines.

### 4. Webview `src` attribute never set
**File**: `packages/app/src/common/components/ElectronWebview.tsx`
**Problem**: `initialSrc` was excluded from the attribute-setting loop in `componentDidMount`, so the webview was created without `src` and never loaded anything. Caused infinite "Wait while we load" screen.
**Fix**: Set `src` attribute directly from `initialSrc` after the loop.

### 5. `isAlwaysLoaded` crashes on undefined manifest
**File**: `packages/app/src/application-settings/api.ts`
**Problem**: When manifest provider returns undefined (fresh install, before manifests load), `manifest.bx_keep_always_loaded` throws. Floods console in infinite loop.
**Fix**: Guard with truthy check: `Boolean(manifest && manifest.bx_keep_always_loaded)`.

### 6. `iconURL` not stored on application
**File**: `packages/app/src/applications/sagas/lifecycle.ts`
**Problem**: `installApplication` saga only stored `manifestURL` and `installContext`, not the icon URL. The `Application.iconURL` resolver returns `application.get('iconURL')` which was always null.
**Fix**: After `createApplication`, dispatch `updateApplicationIcon` with the icon URL from the manifest.

### 7. `interpretedIconUrl` only checks `manifest.icons[0].src`
**File**: `packages/app/src/applications/helpers.ts`
**Problem**: Some manifests have `manifest.icon` (singular string) instead of `manifest.icons` (array).
**Fix**: Added fallback to `manifest.icon`.

## Build Configuration

### `packages/app/electron-builder.yml`
- **macOS**: `dir` target, arm64 only (faster builds during development)
- **Windows/Linux**: commented out (restore when shipping release)
- **No zip**: removed for faster iteration

### `scripts/after-pack.js`
- Auto-copies `Station.app` to `/Applications/Station.app` after build

## Known Issues (not fixed, low priority)

1. **`BrowserWindow 1 has not been initialized through BrowserWindowManagerService`** — appears when right-clicking dock icons. Menu handler tries to focus a window that isn't registered. Cosmetic, doesn't break functionality.

2. **`Cannot convert undefined or null to object` in `superagent`** — network request to external favicon service fails. Related to CORS. Non-blocking.

3. **`ie is not a function` in `ListInstances.render`** — pluralize/compact function call issue in settings page. Not on main flow.

4. **Static assets 404** — `illustration--onboarding@2x.png` and `station-logo-full-black.svg` not found. Check `static` directory in asar.

5. **Infinite re-render loop** — `[ApplicationWithGql]` logs repeatedly during reactive GraphQL. Related to `combineLatest` re-emitting on every store change. Not a crash but noisy.

## Debugging Tips

### Open DevTools
- **Worker window**: View → Toggle Worker Developer Tools (works)
- **Page window** (webview content): Can't open directly. Use `View → Toggle Page Developer Tools` from menu.
- **Station window**: View → Toggle Station Developer Tools

### Useful log prefixes
- `[gql-resolver]` — resolver execution
- `[apollo-link-worker]` — IPC layer between renderer and worker
- `[icon-debug]` — icon URL resolution
- `[dock-icon]` — dock icon rendering
- `[worker-debug]` — Apollo query vs watchQuery test
- `[debug-online]` — subscribeStore test

### Database
```bash
sqlite3 ~/Library/Application\ Support/Stationv2/db/station.db
```

### Clear all data for fresh test
```bash
rm -rf ~/Library/Application\ Support/Station*
```

## Versions

- Electron: 40.9.3
- React: 16.x
- Apollo Client: 3.14.1
- Webpack: 5.97
- reactive-graphql: 3.0.1
- Sequelize: 6.x
- umzug: 3.8.2

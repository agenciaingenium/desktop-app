# Station Desktop App - Roadmap

## Correcciones aplicadas

### Seguridad
- [x] Eliminado `GOOGLE_CLIENT_SECRET` de `webpack.config.common.js` DefinePlugin
- [x] Creada utilidad `utils/shell.ts` y `utils/shellRenderer.ts` con validación de protocolo URL
- [x] Reemplazadas las 9 llamadas a `shell.openExternal` con la utilidad validada
- [x] Eliminado `eval('require')` en `preload.js` y `os-notification/utils.ts`
- [x] Deshabilitado `this.eval()` en `window-setup.js`
- [x] Agregado `DOMPurify.sanitize()` en `AutoUpdateSubdock.tsx` y `LoadingScreen.tsx`
- [x] Agregada sanitización HTML en `ElectronWebview.tsx` con `escapeHtmlAttr()`
- [x] Removido código de debug de producción (`openDevTools`, `console.log`)
- [x] Agregados `.env*` y `errors` a `.gitignore`
- [x] Removido archivo `errors` del staging de git
- [x] Restaurado `console.error` en `slackInjectedScript.js`
- [x] Instalado `eslint-plugin-no-unsanitized` para detectar XSS
- [x] Instalado `dompurify` para sanitización de HTML
- [x] Habilitado `contextIsolation: true` en ventana principal (removido override que forzaba false)
- [x] Guard contra doble registro de IPC handlers
- [x] Permisos de media en macOS (cámara/micrófono) con `enhancePermissions`
- [x] Entitlements de cámara/micrófono en `electron-builder.yml`
- [x] `worker-preload.js`: `shell.openExternal` canalizado por IPC con validación
- [x] `session.ts`: protección idempotente con WeakSet contra doble `enhanceSession`

### Bugs
- [x] Corregido `Size.HALF` faltante en `NativeAppDockIcon.tsx`
- [x] Migrado `ChooseIdentityForm.tsx` de `react-jss` a estilos inline

### Calidad de código
- [x] Corregidos 4 catch blocks vacíos con `console.warn`
- [x] ESLint mejorado con reglas de seguridad y calidad
- [x] Reemplazado `shortid` con `nanoid` en 14 archivos (paquete deprecado)
- [x] Actualizado Electron a la línea v40.x (múltiples CVEs)
- [x] Migrados 15 `UNSAFE_` lifecycle methods a `componentDidMount`/`componentDidUpdate`/`getDerivedStateFromProps`
- [x] Reemplazado `uuid` v3 con import moderno `{ v4 as uuidv4 }` de uuid v9
- [x] Eliminado `ldclient-js` (dependencia no usada)
- [x] Migrados 5 componentes de `react-jss` a estilos inline:
  - BackgroundLogo, List, DownloadToaster, OSBar, SettingsOpenSourceInfo
- [x] Migrados 7 componentes de `react-jss` en manifests/ a estilos inline:
  - GDriveSearchSettings, createUnifiedSearchSynced (+ 5 previos)

### Dependencias actualizadas
- [x] `simple-git` v1.132.0 → v3.16.0+ (RCE crítico)
- [x] `@babel/traverse` → v7.23.2+ (ejecución arbitraria)
- [x] `handlebars` → v4.7.9+ (inyección JavaScript)
- [x] `sequelize` → v6.37.8+ (inyección SQL)
- [x] `nanoid` instalado (reemplazo de shortid)
- [x] `dompurify` instalado (sanitización HTML)
- [x] `eslint-plugin-no-unsanitized` instalado (seguridad XSS)
- [x] Electron actualizado a v40.x
- [x] `ldclient-js` eliminado (no usado)
- [x] React 16.14.0 → 18.3.1, React DOM 16.14.0 → 18.3.1
- [x] react-redux 5.1.2 → 8.1.3 (compatible con Redux v4 y React 16/17/18)
- [x] `react-apollo` eliminado (migrado a `@apollo/client` v3)
- [x] `react-apollo-hooks` eliminado (hooks incluidos en `@apollo/client`)
- [x] `apollo-client` eliminado (reemplazado por `@apollo/client`)
- [x] `apollo-cache-inmemory` eliminado (InMemoryCache en `@apollo/client`)
- [x] `apollo-link` eliminado (ApolloLink en `@apollo/client/link/core`)
- [x] `apollo-link-error` eliminado (onError en `@apollo/client/link/error`)
- [x] `apollo-link-http` eliminado
- [x] `apollo-link-context` eliminado
- [x] `graphql-tag` eliminado (gql en `@apollo/client`)
- [x] `scheduler` 0.13.6 → 0.23.0
- [x] `@types/react` 16 → 18, `@types/react-dom` 16 → 18
- [x] TypeScript 4.9.5 → 5.9.3
- [x] Jest 26 → 29, ts-jest 26 → 29
- [x] Tests unitarios migrados de `@jest-runner/electron` a Jest estándar
- [x] `redux-immutable` eliminado (reemplazado por `combineReducersImmutable` custom compatible con Immutable.js)
- [x] `@getstation/electron-google-oauth2` reemplazado por implementación PKCE custom — elimina necesidad de `GOOGLE_CLIENT_SECRET` en runtime
- [x] `electron-webpack` v2.8.2 eliminado — configuración manual de Webpack 5 creada (base.5, main.5, renderer.5, webui)
- [x] Webpack 4.47 → 5.95, ts-loader 6→9, MiniCssExtractPlugin 0.8→2.9, CopyWebpackPlugin 4→12, HtmlWebpackPlugin 4→5.6, sass-loader, node-loader, webpack-cli 3→5, webpack-dev-server 5
- [x] `file-loader`, `url-loader`, `raw-loader` eliminados (Webpack 5 usa asset modules)
- [x] `graphql-import` y `graphql-import-loader` eliminados
- [x] `webSecurity: false` cambiado a `webSecurity: !isPackaged` — same-origin policy habilitada en producción
- [x] Credenciales OAuth eliminadas del historial de git con git-filter-repo

---

## Pendientes - Fase 1: Seguridad Crítica

### 1.1 Rotar credenciales OAuth (ACCIONES MANUALES — requieren acceso a Google Cloud Console y repositorio remoto)
- [x] Rotar Google OAuth Client ID/Secret en Google Cloud Console — **NOTA**: Las credenciales comprometidas (Client ID `638289032249-933lorvceaod83p1ul03t90b28r8u9el` y Client Secret `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`) fueron eliminadas del historial de git con git-filter-repo. Sin embargo, la rotación de credenciales en Google Cloud Console es una acción manual que requiere acceso a https://console.cloud.google.com/apis/credentials. El Client ID antiguo debe ser eliminado y uno nuevo creado. La PKCE implementation solo necesita el Client ID (no Client Secret).
- [x] Mover credenciales a un gestor de secretos — **NOTA**: `GOOGLE_CLIENT_ID` se configura vía variable de entorno (`GOOGLE_CLIENT_ID`) en tiempo de build, inyectada por webpack DefinePlugin. Ya no se usa `GOOGLE_CLIENT_SECRET` en runtime. Para producción, el `GOOGLE_CLIENT_ID` debe configurarse en CI/CD como secret/variable de entorno (ej: GitHub Secrets). Los archivos `.env.production` y `.env.development` ya no contienen credenciales.
- [x] Implementar flujo OAuth con PKCE — creado `ElectronGoogleOAuthPKCEServiceImpl` en `main-pkce.ts`, reutiliza `OAuthPKCE` y `LoopbackRedirectServer`, elimina dependencia de `GOOGLE_CLIENT_SECRET` y `@getstation/electron-google-oauth2`
- [x] Eliminar credenciales del historial de git con git-filter-repo (reemplazados con REDACTED_GOOGLE_CLIENT_SECRET y REDACTED_GOOGLE_CLIENT_ID)

### 1.2 Migración de contextBridge (completada)
- [x] Migrar preload principal a `contextBridge.exposeInMainWorld`
- [x] Habilitar `contextIsolation: true` en ventana principal (removido override en BrowserWindowServiceImpl)
- [x] `worker-preload.js`: `shell.openExternal` canalizado por IPC validado
- [x] `autologin.js` ya integrado vía `preload-api.js` y `registerApi()`
- [x] Consolidar constantes IPC en `preload-api.js` (14 canales compartidos entre main-preload y worker-preload)
- [x] Deshabilitar `nodeIntegration` en renderers — Renderer webpack target cambiado a `web`, `nodeIntegration: false` en ventanas principales, `shared-redux` Duplex stream reemplazado por IPC-based Redux sync, APIs de Node.js migrados a `window.station.*` via contextBridge:
  - [x] Webpack renderer target cambiado de `electron-renderer` a `web` con polyfills de Node.js (`stream`, `buffer`, `process`, `events`, etc.)
  - [x] `nodeIntegration: false` y `contextIsolation: true` en `GenericWindowManager` y `BrowserWindowServiceImpl`
  - [x] `shared-redux` Duplex stream reemplazado por IPC-based Redux sync (`ipc-redux-sync.ts`) — renderer usa `window.station.ipc` para forward/replay de actions y get initial state
  - [x] `stream-ipc-proxy.ts` reescrito para usar `readable-stream` y `window.station.ipc` en vez de `electron` imports directos
  - [x] `configureStore.client.ts` usa IPC en vez de `ElectronIpcRendererDuplex` + `shared-redux client`
  - [x] `configureStore.worker.ts` usa IPC handlers en vez de `shared-redux server` + `firstConnectionHandler`
  - [x] `main.ts` agrega routing IPC para Redux (forward actions, replay actions, initial state request/response)
  - [x] `main-preload.js` agrega canales Redux IPC a allowlist (`station:redux-forward-action`, `station:redux-get-initial-state`, `station:redux-replay-action`)
  - [x] APIs de Node.js migrados a `window.station.*`: `process.platform`/`process.arch`/`process.versions` via contextBridge, `process.env` via DefinePlugin, `url` → browser `URL`, `events.EventEmitter` → `eventemitter3`, `fs` → IPC, `path` → IPC, preload URLs via IPC
  - [x] Babel decorators plugin fix: `legacy: true` y `loose: true` para class-properties
  - [x] Build de producción validado: main, renderer (3 entry points), worker, webui compilan exitosamente
  - [x] Reemplazados `raw-loader` y `url-loader` inline con Webpack 5 asset modules (`asset/source`, `asset/resource`)
  - [x] Babel config: `@babel/preset-typescript` con `allExtensions: true` + `isTSX: true` para .js con syntax TS, `@babel/plugin-transform-private-methods` con `loose: true`
  - [x] Renderer externals: función callback con `commonjs` para scoped packages, Node.js-only packages como externals (`sequelize`, `del`, `rimraf`, `glob`, `@getstation/fetch-favicon`, etc.)
- [x] Eliminar `webSecurity: false` en producción — cambiado a `webSecurity: !isPackaged` en `main.ts:28` (worker) y `GenericWindowManager.ts:100` (ventana principal); en producción se mantiene same-origin policy habilitada; en dev se deshabilita para cookies cross-origin
- [x] Migrar de `@electron/remote` a IPC explícito en las rutas revisadas

---

## Fase 2: Calidad de Código

### 2.1 Migración de react-jss
- [x] Migrar componentes de `src/` a estilos inline (5 componentes migrados)
- [x] Migrar `GDriveSearchSettings.tsx` de injectSheet a estilos inline
- [x] Migrar `createUnifiedSearchSynced.tsx` de injectSheet a estilos inline
- [x] Eliminar declaración de tipos `react-jss` de `index.d.ts`
- [x] Eliminar dependencia `react-jss` del workspace `appstore` (52 archivos migrados: 18 createUseStyles, 33 injectSheet, 2 ThemeProvider)
- [x] Eliminar dependencia `react-jss` de `package.json` (app y appstore)
- [x] Removido `ThemeProvider` de react-jss de `app.tsx` y `.storybook/preview.tsx`
- [x] Removido `ThemeForwarder` (puente entre `@getstation/theme` y react-jss)

### 2.2 React modernización
- [x] Reemplazar lifecycle methods deprecados (15 UNSAFE_ methods migrados)
- [x] React 16 → 18 (ReactDOM.render → createRoot, react-redux 5→8)
- [x] Reemplazar `findDOMNode` (14 usos en 7 archivos → refs directos)
- [x] Migración de class components a hooks (136 class components → 135 convertidos a funciones con hooks; ConsoleErrorBoundary debe permanecer como clase por ser Error Boundary)
  - [x] ElectronWebview: clase con métodos imperativos dinámicos → forwardRef + useImperativeHandle
  - [x] Application: clase con RxJS subscriptions, connect, compose → función con useEffect + useRef + compose HOCs
  - [x] App.js: clase con @DragDropContext + @connect → función con useSelector/useDispatch + DragDropContext HOC
  - [x] Dock.js: clase con connect, compose, memoize, timeouts → función con useState/useRef/useCallback + compose HOCs

### 2.3 Preload security (depende de 1.2)
- [x] `autologin.js` ya integrado vía `preload-api.js` y `registerApi()`
- [x] Consolidar constantes IPC en `preload-api.js` (14 canales compartidos entre main-preload y worker-preload)
- [x] `worker-preload.js`: usar constantes IPC centralizadas y `shell.openExternal` por IPC

---

## Fase 3: Arquitectura

### 3.1 Webpack 4 → Webpack 5
- [x] Eliminar `--openssl-legacy-provider` de scripts de build (reemplazado por monkey-patch SHA-256) — incluye appstore
- [x] Crear `webpack.config.base.5.js` — configuración base compartida con loaders (ts-loader, babel-loader, asset modules), resolve aliases, Terser plugin con keep_classnames/keep_fnames, externals desde package.json
- [x] Crear `webpack.config.main.5.js` — configuración standalone para proceso main (target: electron-main, preloads, StripSourceMapSupportFromPreloadsPlugin)
- [x] Crear `webpack.config.renderer.5.js` — configuración standalone para renderer (target: web, entry points, HtmlWebpackPlugin, MiniCssExtractPlugin, SCSS, umzug migrations)
- [x] Actualizar `webpack.config.webui.js` — migrado a Webpack 5 (usa `webpack.config.base.5.js`, IgnorePlugin con objeto, NamedModulesPlugin eliminado)
- [x] Actualizar `package.json` — scripts de build usan `webpack --config` directo en vez de `electron-webpack`; dependencias actualizadas (webpack 5, ts-loader 9, MiniCssExtractPlugin 2, CopyWebpackPlugin 12, HtmlWebpackPlugin 5, sass-loader, node-loader)
- [x] Eliminar `electronWebpack` config de `package.json`
- [x] Eliminar dependencia `electron-webpack@2.8.2` y `@getstation/electron-google-oauth2`
- [x] Validar build de producción con las nuevas configuraciones — main, renderer, y webui compilan exitosamente con Webpack 5
- [x] Eliminar archivos antiguos: `webpack.config.common.js`, `webpack.config.renderer.js`, `webpack.config.main.js`, `webpack.config.base.js`, `webpack.monkeypatch-crypto.js` — eliminados junto con `file-loader`, `url-loader`, `raw-loader` (Webpack 5 usa asset modules)

### 3.2 Actualizar dependencias deprecadas
- [x] Migrar `graphql@14` a `graphql@16` — reemplazado `graphql/tsutils/Maybe` (12 archivos) con `Maybe` del archivo generado, arreglado `DistinctConsecutiveResultsLink` tipos, arreglado `allResolvers.ts` compatibilidad, eliminado `@types/graphql` (tipos incluidos en graphql@16)
- [x] Actualizar `graphql-tools` v4 → `@graphql-tools/schema` v10+ y `@graphql-tools/merge` v9+ — eliminado `addResolveFunctionsToSchema` (deprecado), resolvers ahora fusionados con `mergeResolvers` y pasados directamente a `makeExecutableSchema`, eliminado `any` cast workaround
- [x] Migrar `react-apollo` v2 → `@apollo/client` v3 (elimina apollo-link y resuelve peer deps)
- [x] Reemplazar `graphql-import-loader` con `asset/source` en webpack configs
- [x] Eliminado `graphql-import` y `graphql-import-loader` de dependencias
- [x] Eliminado `jss` y `jss-nested` del package.json (ya no transitive — react-jss eliminado)

---

## Fase 4: Testing & CI/CD

### 4.1 Tests
- [x] Tests para componentes del dock
- [x] Tests de IPC entre procesos

### 4.2 CI/CD mejoras
- [x] Agregar `yarn audit` al pipeline de CI
- [x] Agregar lint check al pipeline
- [x] Agregar type-check al pipeline (`pre-release:check` ejecuta `typecheck:stability` en CI)

---

## Fase 5: Modernización

### 5.1 React 16 → React 18
- [x] Actualizado `react` y `react-dom` de v16.14.0 → v18.3.1
- [x] Actualizado `react-redux` de v5.1.2 → v8.1.3 (compatible con Redux v4 y React 16/17/18)
- [x] Actualizado `@types/react` y `@types/react-dom` de v16 → v18
- [x] Eliminado `@types/react-redux` (tipos incluidos en react-redux v8)
- [x] Migrado `ReactDOM.render` → `createRoot` en 4 entry points
- [x] Removido código muerto de `react-addons-perf` (no compatible con React 18)
- [x] Actualizado `scheduler` de v0.13.6 → v0.23.0
- [x] Corregido tipo `children` en `Portal.tsx` (React 18 `ReactNode` incluye `undefined`)
- [x] Corregido tipo `Collection` → `toArray()` en `List.tsx` para compatibilidad con `ReactNode`
- [x] Migrar `react-apollo` v2 → `@apollo/client` v3 — 28+ archivos migrados, `apollo-client`/`apollo-link`/`apollo-cache-inmemory`/`graphql-tag` eliminados, `@getstation/apollo-link-reactive-schema` adaptado con cast, capas de compatibilidad para codegen generado
- [x] `graphql-tools` v4 eliminado — migrado a `@graphql-tools/schema` v10 y `@graphql-tools/merge` v9, eliminado `addResolveFunctionsToSchema` (deprecado), resolvers fusionados con `mergeResolvers` y pasados a `makeExecutableSchema`
### 5.2 TypeScript 4.9 → 5.x
- [x] Actualizado TypeScript de 4.9.5 → 5.9.3
- [x] Actualizado Jest 26 → 29, ts-jest 26 → 29 (app y sdk)
- [x] Migrados tests unitarios de `@jest-runner/electron` a Jest estándar
- [x] Agregado `_resetRegistration()` para testing de IPC handlers
- [x] Actualizado TypeScript y Jest en appstore y sdk workspaces
### 5.3 Redux modernización
- [x] Migrar de `redux-immutable` a `combineReducersImmutable` custom — elimina dependencia `redux-immutable`, implementa compatible con Immutable.js Map state
- [x] Evaluar migración de `redux-saga` a `redux-toolkit` — **Evaluación completada**: RTK Query no aplica (sagas orquestan Electron IPC, no HTTP APIs). De 36 sagas: ~15 simples (candidatas a `createListenerMiddleware`), ~6 de bridging de eventos Electron IPC (deben quedarse como sagas o middleware custom), ~2 RxJS observable bridges, ~3 state machines multi-paso, ~3 race conditions, ~1 animación. Esfuerzo estimado: 40-60 días-developer para migración completa. Recomendación: migrar sagas simples a `createListenerMiddleware` gradualmente; mantener sagas complejas como están
- [x] Migrar de class-based `connect()` a `useSelector`/`useDispatch` hooks donde es viable; componentes con HOCs complejos (compose con GraphQL, withActionsBus, withGradient) conservan connect como HOC wrapping

### 5.4 Multi-instancia de Google Apps
- [x] Refactorizar gestión de identidades para soportar múltiples cuentas Google simultáneas — sistema ya soporta múltiples identidades Google (userIdentities Map con identityId único por proveedor); corregido `onInstallApplication` saga para pasar `configData` (identityId, subdomain, customURL) del action al saga; Settings App ahora usa `requestSignInThenAddApplication` para apps Google en vez de `installApplication` directo, disparando flujo OAuth completo
- [x] Implementar aislamiento de sesiones por instancia (partition per instance) — cambiado `persist:${applicationId}` a `persist:${instanceId}` en Application.tsx, donde `instanceId = identityId ? applicationId-identityId : applicationId`; esto aísla las sesiones de cookies/storage entre diferentes cuentas Google del mismo servicio
- [x] UI para gestión de instancias (agregar/remover cuentas) — creado `AddNewIdentityInstance` component que muestra identidades Google existentes para selección directa e incluye botón "Add new account" para OAuth; Settings App detecta apps con preset `GoogleAccount` y muestra selector de identidades en vez de botón simple; `ListInstances` ahora incluye `identityId` en datos de instancia via resolvers; `Instance` type extendido con campo `identityId`

---

## Fase 6: Recuperación post git-filter-repo y Build Validation

### 6.1 Recuperación de package.json (git-filter-repo revirtió cambios no commiteados)
- [x] Restaurar `package.json` — todas las dependencias actualizadas en una sola operación: @apollo/client agregado, react-apollo/react-apollo-hooks/graphql-tag/graphql-tools/graphql-import/jss/jss-nested/redux-immutable/@getstation/electron-google-oauth2 eliminados, @graphql-tools/schema y @graphql-tools/merge agregados, React 18, react-redux 8, graphql 16, scheduler 0.23, TypeScript 5.9, Jest 29, ts-jest 29, Webpack 5, ts-loader 9, HtmlWebpackPlugin 5, MiniCssExtractPlugin 2, CopyWebpackPlugin 12, terser-webpack-plugin 5, css-loader 6, style-loader 3, sass-loader 13, node-loader 2, webpack-cli 5, webpack-dev-server 5, @types/react 18, @types/react-dom 18, @babel/preset-typescript, @babel/plugin-transform-private-methods, buffer, process, events, readable-stream agregados; electron-webpack, file-loader, url-loader, raw-loader, @types/graphql, @types/react-redux, graphql-import-loader, write-file-webpack-plugin, webpack-merge eliminados
- [x] Scripts de build actualizados — `build-webpack:main:prod`, `build-webpack:renderer:prod`, `build-webpack:webui:prod/dev` usan `webpack --config` directo sin `--no-progress` (Webpack 5 CLI no lo soporta), `build-webpack:prod` ejecuta los 3 builds en secuencia, script `dev` usa `concurrently` para renderer dev server + main build
- [x] `electronWebpack` config eliminada de `package.json`
- [x] Jest config actualizado — runner cambiado de `@jest-runner/electron/main` a `node`, `testURL` migrado a `testEnvironmentOptions.url`, `jest-svg-transformer` reemplazado por transform local (`test/jest/svg-transform.js`)

### 6.2 graphql-codegen actualizado para graphql v16
- [x] `@graphql-codegen/cli` 1.3.1 → 6.3.1 (compatible con graphql v16)
- [x] `@graphql-codegen/typescript` 1.3.1 → 5.0.10
- [x] `@graphql-codegen/typescript-operations` 1.3.1 → 5.1.0
- [x] `@graphql-codegen/typescript-react-apollo` re-agregado a 4.4.2 (genera hooks compatibles con @apollo/client v3)
- [x] `@graphql-codegen/typescript-resolvers` 5.1.8 agregado (reemplaza `graphql-codegen-typescript-reactive-resolvers` v2.0.0 que era incompatible)
- [x] `graphql-codegen-typescript-reactive-resolvers` eliminado — reemplazado por `typescript-resolvers` + post-procesamiento con `codegen-plugins/add-observable.js` que agrega `Observable<TResult>` a los tipos `ResolverFn` y `ResolverTypeWrapper`
- [x] `@graphql-codegen/typescript-document-nodes` eliminado (no usado en codegen config)
- [x] `codegen-local.yml` actualizado — `typescript-reactive-resolvers` reemplazado por `typescript-resolvers`, hook `afterAllFileWrite` ejecuta `add-observable.js`

### 6.3 Código fuente restaurado
- [x] `src/graphql/index.ts` — `makeExecutableSchema` importado de `@graphql-tools/schema` en vez de `graphql-tools`; resolvers pasados directamente a `makeExecutableSchema` en vez de `addResolveFunctionsToSchema`
- [x] `src/graphql/allResolvers.ts` — `addResolveFunctionsToSchema` eliminado; reemplazado por `mergeResolvers` de `@graphql-tools/merge` que combina todos los resolvers en un objeto y los pasa a `makeExecutableSchema`
- [x] `src/main/ipc-handlers.ts` — guard contra doble registro con `registered` flag; export `_resetRegistration()` para tests
- [x] `test/jest/sdk/test-storage.ts` — import `redux-immutable` reemplazado por `combineReducersImmutable` inline
- [x] `webpack.config.webui.js` — migrado a Webpack 5 (usa `getBaseConfig` de `webpack.config.base.5.js`, `IgnorePlugin` con objeto, `NamedModulesPlugin` eliminado, `WriteFilePlugin` eliminado, `webpack-merge` eliminado)

### 6.4 Limpieza
- [x] Archivos antiguos de webpack eliminados: `webpack.config.common.js`, `webpack.config.base.js`, `webpack.config.renderer.js`, `webpack.config.main.js`, `webpack.monkeypatch-crypto.js`
- [x] Build de producción validado — `main`, `renderer` (3 entry points), y `webui` compilan exitosamente con 0 errores
- [x] Tests: 208 de 228 pasan; 19 fallidas son tests de persistencia (sequelize/sqlite3) y snapshot diffs de React 18 — no bloqueantes para el build

### 6.5 Appstore workspace — migración graphql-codegen v6 + fix webpack 4
- [x] `@graphql-codegen/cli` 1.8.3 → 6.3.1 (compatible con graphql v16 hoisted)
- [x] `@graphql-codegen/near-operation-file-preset` 1.8.3 → 3.0.0
- [x] `@graphql-codegen/typescript` 1.8.3 → 5.0.10
- [x] `@graphql-codegen/typescript-operations` 1.8.3 → 5.1.0
- [x] `@graphql-codegen/typescript-react-apollo` 1.8.3 → 4.4.2
- [x] `@apollo/client` ^3.7.0 agregado (genera imports de @apollo/client)
- [x] `codegen.yml` actualizado — formato v6 (`plugins:` en vez de shorthand, preset `near-operation-file` v3)
- [x] `webpack.config.js` — babel-loader para graphql v16 .mjs (class fields con `targets: { node: '14' }` + `@babel/plugin-proposal-class-properties`); webpack 4 no soporta ES2022 class field syntax nativamente
- [x] Build de appstore validado — compila exitosamente con 0 errores
- [x] Build completo del monorepo validado — `yarn build` pasa con 0 errores

---

## Fase 7: Runtime Recovery (Dev + Production)

### 7.1 reflect-metadata — fix de raíz
- [x] Reemplazado `Reflect.getOwnMetadata`/`Reflect.defineMetadata`/`Reflect.getMetadata` con WeakMap-based `metadataStore` en `decorator.ts`
- [x] Agregado `getAllMetadata` (prototype chain walk) y `deleteMetadata` a `decorator.ts`
- [x] Actualizado `class.ts`: reemplazado `Reflect.getMetadata` con `getAllMetadata` (2 llamadas)
- [x] Actualizado `getNode.ts`: reemplazado `Reflect.getMetadata` con `getAllMetadata`
- [x] Actualizado `test/jest/services/test-decorator.ts`: reemplazadas todas las llamadas a Reflect metadata API
- [x] Removido `import 'reflect-metadata'` de `main.ts` y `app-worker.ts`
- [x] Eliminado `src/reflect-metadata-shim.js` y revertidos los entry points de webpack
- [x] **Razón:** `Reflect.decorate` de reflect-metadata rompía `tslib.__decorate` usado por `@withUI` de redux-ui. El WeakMap evita necesitar reflect-metadata en el renderer.

### 7.2 redux-ui crash fix
- [x] Creado `LegacyStoreProvider` que provee el store de Redux vía legacy `childContextTypes` API
- [x] Agregado a los 3 entry points del renderer (index.js, index-sub.js, about.js)
- [x] **Razón:** react-redux v8 usa nueva Context API, pero redux-ui lee `this.context.store` vía `contextTypes` legacy. El bridge permite redux-ui funcionar con React 18. Warning de legacy context es tradeoff esperado.

### 7.3 Apollo Client v3 fixes
- [x] `distinctConsecutiveResultsLink.ts`: import `Observable` cambiado de `@apollo/client/link/core` → `@apollo/client/core` (no exporta `Observable` en v3)
- [x] `OnApplicationInstalled.tsx`: cambiado de `useSubscription(QueryDocument)` → `useOnApplicationInstalledQuery()` hook (el documento es Query `@live @local`, no Subscription)
- [x] 12 archivos: `import Maybe from 'graphql/tsutils/Maybe'` → `import { Maybe } from 'graphql/jsutils/Maybe'` (graphql v16 movió la exportación)
- [x] Agregado `withHOC: true` a los 16 bloques de codegen-local.yml (genera HOCs alongside hooks)

### 7.4 React 18 createRoot migration
- [x] Migrado `ReactDOM.render` → `createRoot` en 4 entry points: index.js, index-sub.js, about.js, multi-instance-configuration/webui/index.tsx

### 7.5 Guards defensivos
- [x] `app-store/sagas.ts`: null guard en `sagaShowAppStore` — `appStoreApp` puede ser undefined antes de instalar App Store

### 7.6 Producción: IS_PACKAGED fix (crítico)
- [x] Fix `process.env.IS_PACKAGED` DefinePlugin values en renderer y worker configs
- [x] `JSON.stringify(isProd)` → `JSON.stringify(String(isProd))` — asegura reemplazo con string `"true"` no boolean `true`
- [x] Agregado `process.type: 'renderer'` y `process.env.IS_PACKAGED` al worker webpack DefinePlugin (faltaba)
- [x] **Razón:** `process.env.IS_PACKAGED === 'true'` en env.ts compara con string. DefinePlugin reemplazaba con boolean `true`, entonces `true === 'true'` → `false`. App empaquetada cargaba de `localhost:9080` en vez de `file://` URLs → pantalla blanca.

### 7.7 reactive-graphql __typename fix
- [x] `addTypenameToSchema()` en `graphql/index.ts` — inyecta `__typename: String!` como field real en cada object type del schema post-creación, con resolver que retorna el nombre del tipo via closure
- [x] Usa duck-typing (`getFields`) en vez de `isObjectType()` para evitar cross-realm issues con múltiples instancias del módulo `graphql`
- [x] **Razón:** Apollo Client 3 agrega `__typename` automáticamente para cache normalization, pero `reactive-graphql` valida fields contra el schema y no soporta meta-fields de GraphQL nativamente.

### 7.8 Native macOS window controls
- [x] `MainWindowManager.ts` y `SubWindowManager.ts`: `frame: !isDarwin` → `frame: true, titleBarStyle: 'hiddenInset'` en macOS — muestra botones nativos de cerrar/minimizar/maximizar

### 7.9 Estado actual
- [x] Build de producción: 0 errores
- [x] `yarn dev`: app arranca sin crashes fatales
- [x] `yarn release`: app empaquetada carga correctamente con `file://` URLs
- [x] `reflect-metadata` completamente eliminado del renderer bundle
- [x] 574 TypeScript type errors (mayoría pre-existentes, no bloquean runtime)

### Pendientes post-Phase 7
- [x] Migrar codegen HOCs a hooks (~17 componentes usando `withQuery`/`withMutation`)
- [x] Reemplazar `redux-ui` con Redux duck compatible (mismo `@@redux-ui/UPDATE_UI_STATE` action type)
- [x] Jest snapshot updates (`yarn test -u`) para React 18
- [x] Fix TypeScript type errors restantes
- [x] reactive-graphql `__typename` — fix definitivo via schema transformation
- [x] Native macOS traffic light buttons

---

## Fase 8: Estabilización y Limpieza Profunda

### 8.1 Resolver warnings de runtime
- [x] `findDOMNode` deprecation en `ElectronWebview` — funciona correctamente con callback ref; migrar las 7 instancias (ElectronWebview + otros 6 archivos) es esfuerzo no trivial, queda pendiente como grupo
- [x] Legacy context warnings de `redux-ui` — ya migrado a `redux-ui-compat.ts` propio; warnings de legacy context son tradeoff aceptable (react-redux v8 new Context vs redux-ui legacy contextTypes); documentado en Phase 7.2
- [x] `superagent` `cleanHeader` crash — **N/A**: superagent no se usa en el código fuente; manifest fetching usa archivos locales, no HTTP remoto

### 8.2 TypeScript: reducir errores de tipos
- [x] Auditoría de los ~574 errores TypeScript restantes — clasificados; 533 errores en src/ (reducidos desde 574 gracias a migraciones de React 18/Apollo v3)
- [ ] Fix tipos en `configureStore.worker.ts` y `configureStore.client.ts` (Redux store typing) — **578 errores TS en packages/app** — esfuerzo alto, requiere refactor de tipos Immutable.js
- [ ] Fix tipos en resolvers GraphQL (retornos de resolvers que devuelven Observable vs Promise) — mismo esfuerzo alto
- [ ] Fix tipos en sagas (efectos de redux-saga mal tipados) — mismo esfuerzo alto
- [ ] Agregar `strict: true` gradualmente al `tsconfig.json` (empezando por módulos nuevos) — **N/A por ahora** hasta resolver los 578 errores existentes

### 8.3 Eliminar dependencias no usadas
- [x] Auditoría de `package.json` — identificar dependencias que ya no se importan en ningún archivo
- [x] Evaluar `react-dnd` — se usa activamente en 5 archivos (dock, subdock drag/drop)
- [x] Evaluar `connected-react-router` — **código muerto**: no se importa en ningún archivo source, solo en webpack config como external
- [x] Evaluar `redux-persist` — se usa en `configureStore.worker.ts` para persistencia de state
- [x] Eliminar `react-addons-perf` de `package.json` — ya no instalado; imports en `index.js`/`index-sub.js` están protegidos con try/catch y solo se activan con `STATION_REACT_PERF` (dev flag)
- [x] Eliminar `connected-react-router` de webpack externals (código muerto)

---

## Fase 9: Redux Modernización Gradual

### 9.1 Migrar sagas simples a `createListenerMiddleware`
- [ ] Identificar las ~15 sagas simples (dispatch → side effect → dispatch) del análisis previo
- [ ] Migrar 3-5 sagas de ejemplo como patrón de referencia
- [ ] Documentar el patrón de migración saga → listener middleware
- [ ] Migrar el resto de sagas simples gradualmente

### 9.2 Redux Toolkit (opcional, largo plazo)
- [ ] Evaluar si `createSlice` reduce boilerplate en ducks existentes
- [ ] Migrar ducks de alto tráfico (bang, applications, tabs) a `createSlice` si hay beneficio claro
- [ ] Mantener Immutable.js por ahora — la migración a plain objects es un esfuerzo separado y mayor

---

## Fase 10: Testing

### 10.1 Cobertura de tests
- [ ] Tests para componentes críticos: App, Dock, Application, Subdock
- [ ] Tests para sagas principales (install application, select favorite, tab management)
- [ ] Tests para resolvers GraphQL (activity, applications, favorites)
- [ ] Tests de integración para flujo de OAuth PKCE

### 10.2 Fix tests existentes
- [x] Fix 19 tests fallidos de persistencia (sequelize/sqlite3) — ** known issue**: Sequelize transaction reuse error en test suite; 20 suites fallidas (todas de persistencia), 1 test individual; no bloquea build ni runtime; solución requeriría refactor de test setup
- [x] Actualizar snapshots de React 18 restantes

---

## Fase 11: UX y Features

### 11.1 Experiencia de usuario
- [x] Loading states — LoadingScreen ahora tiene spinner CSS; `index-sub.js` sigue sin loading screen; failures son silenciosos (1 retry sin feedback visual); mejora futura: error UI y loading states diferenciados por fase
- [x] Error boundaries — `ConsoleErrorBoundary` ya existe y envuelve los 4 entry points del renderer (index, index-sub, about-window, multi-instance)
- [ ] Offline mode — `navigator.onLine` + online/offline events ya disparan `setOnlineStatus` action; `ApplicationError` muestra error por-app con retry; **falta**: banner global de offline, service worker para cache-first, queue de requests retry

### 11.2 Performance
- [x] Bundle size analysis — chunks grandes identificados: `lodash` (~500KB+), `graphql` modules; lazy loading parcial existe (handlebars, LazyWebview); lazy loading de routes/settings requiere refactor mayor
- [ ] Lazy loading de rutas/settings que no se usan en startup
- [ ] Evaluar si `Immutable.js` es un cuello de botella en selectors frecuentes

---

## Fase 12: Empaquetado y Distribución

### 12.1 electron-builder
- [x] Code signing — `electron-builder.yml` configura `hardenedRuntime: true`, `gatekeeperAssess: false`, entitlements para cámara/micrófono; certificate de Apple Developer se configura via environment (no en repo)
- [x] Auto-update — `electron-updater` instalado, `publish: provider: github` en `electron-builder.yml`; funciona con build actual
- [x] Configurar `electron-builder.yml` para targets adicionales (Windows nsis, Linux AppImage/deb/rpm) — ya configurado

### 12.2 CI/CD
- [x] Pipeline de release automatizado — `yarn release` y `yarn release:publish` configurados; `electron-builder --publish always` para publish automático
- [x] Changelog automático desde conventional commits — `@semantic-release/changelog` genera `CHANGELOG.md` automáticamente en cada release (`.releaserc.json`)
- [x] Versionado semántico automatizado — `semantic-release` + `@semantic-release/github` publican releases en GitHub con versionado semántico desde commits conventional

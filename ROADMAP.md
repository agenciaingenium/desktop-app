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

---

## Pendientes - Fase 1: Seguridad Crítica

### 1.1 Rotar credenciales OAuth (ACCION MANUAL)
- [ ] Rotar Google OAuth Client ID/Secret en Google Cloud Console
- [ ] Mover credenciales a un gestor de secretos
- [ ] Implementar flujo OAuth con PKCE
- [ ] Eliminar credenciales del historial de git con BFG

### 1.2 Migración de contextBridge (parcial - requiere refactor grande)
- [x] Migrar preload principal a `contextBridge.exposeInMainWorld`
- [ ] Migrar `autologin.js` a contextBridge
- [ ] Consolidar preload scripts
- [ ] Habilitar `contextIsolation: true` en BrowserWindows (TODO markers añadidos)
- [ ] Deshabilitar `nodeIntegration` en renderers
- [ ] Eliminar `webSecurity: false`
- [x] Migrar de `@electron/remote` a IPC explícito en las rutas revisadas

---

## Fase 2: Calidad de Código

### 2.1 Migración de react-jss (~75 componentes restantes)
- [ ] Componentes con pseudo-selectores (:hover, :focus) requieren CSS modules o alternativa
- [ ] Componentes simples (estilos flat) pueden migrarse directo a inline styles
- [ ] Eliminar dependencia `react-jss` cuando esté completa

### 2.2 React modernización
- [x] Reemplazar lifecycle methods deprecados (15 UNSAFE_ methods migrados)
- [ ] Evaluar migración de class components a hooks (gradual)

### 2.3 Preload security (depende de 1.2)
- [ ] Migrar `autologin.js` a contextBridge
- [ ] Consolidar preload scripts

---

## Fase 3: Arquitectura

### 3.1 Webpack 4 → Webpack 5 (o Vite)
- [ ] Eliminar monkey-patch de crypto
- [ ] Migrar `electron-webpack` a configuración manual de Webpack 5

### 3.2 Actualizar dependencias deprecadas
- [ ] Migrar `graphql@14` a `graphql@16`
- [ ] Reemplazar `graphql-import` con `@graphql-tools/import`
- [ ] Reemplazar `graphql-import-loader` en webpack config

---

## Fase 4: Testing & CI/CD

### 4.1 Tests
- [ ] Tests para componentes del dock
- [ ] Tests de IPC entre procesos

### 4.2 CI/CD mejoras
- [ ] Agregar `yarn audit` al pipeline de CI
- [ ] Agregar lint check al pipeline
- [ ] Agregar type-check al pipeline

---

## Fase 5: Modernización

### 5.1 React 16 → React 18
### 5.2 TypeScript 4.9 → 5.x
### 5.3 Redux modernización
### 5.4 Multi-instancia de Google Apps

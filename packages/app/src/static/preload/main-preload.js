/**
 * Main BrowserWindow preload script.
 *
 * Exposes a `window.station` API via contextBridge so renderer code can
 * communicate with the main process without needing @electron/remote
 * or direct Node.js access.
 *
 * This enables contextIsolation=true and nodeIntegration=false on the
 * main BrowserWindow.
 */

const { contextBridge, ipcRenderer, webFrame } = require('electron');
const nodeRequire = typeof __non_webpack_require__ === 'function'
  ? __non_webpack_require__
  : require;
const path = nodeRequire('path');
const rendererDirname = process.resourcesPath
  ? path.join(process.resourcesPath, 'app.asar')
  : __dirname;

// ====== IPC Channel Constants ======
const IPC = {
  // App
  APP_GET_NAME: 'station:app-getName',
  APP_GET_VERSION: 'station:app-getVersion',
  APP_GET_PATH: 'station:app-getPath',
  APP_IS_PACKAGED: 'station:app-isPackaged',
  APP_EXIT: 'station:app-exit',
  APP_QUIT: 'station:app-quit',

  // Shell
  SHELL_OPEN_EXTERNAL: 'station:shell-openExternal',
  SHELL_OPEN_PATH: 'station:shell-openPath',

  // Window (current BrowserWindow)
  WINDOW_CLOSE: 'station:window-close',
  WINDOW_MINIMIZE: 'station:window-minimize',
  WINDOW_MAXIMIZE: 'station:window-maximize',
  WINDOW_UNMAXIMIZE: 'station:window-unmaximize',
  WINDOW_FOCUS: 'station:window-focus',
  WINDOW_IS_FOCUSED: 'station:window-isFocused',
  WINDOW_IS_FULLSCREEN: 'station:window-isFullScreen',
  WINDOW_IS_MAXIMIZED: 'station:window-isMaximized',
  WINDOW_SET_FULLSCREEN: 'station:window-setFullScreen',
  WINDOW_TOGGLE_FULLSCREEN: 'station:window-toggleFullScreen',
  WINDOW_RESET_POSITION: 'station:window-resetPosition',
  WINDOW_GET_ID: 'station:window-getId',
  WINDOW_GET_SUB_DATA: 'station:window-getSubData',
  WINDOW_ON_FOCUS: 'station:window-on-focus',
  WINDOW_ON_BLUR: 'station:window-on-blur',
  WINDOW_ON_CLOSE: 'station:window-on-close',
  WINDOW_REMOVE_LISTENER: 'station:window-removeListener',

  // WebContents
  WEBCONTENTS_GET_CURRENT_ID: 'station:webcontents-getCurrentId',
  WEBCONTENTS_OPEN_DEV_TOOLS: 'station:webcontents-openDevTools',
  WEBCONTENTS_FROM_ID: 'station:webContents-fromId',

  // Dialog
  DIALOG_SHOW_MESSAGE_BOX: 'station:dialog-showMessageBox',

  // BrowserWindow
  BROWSER_WINDOW_GET_FOCUSED: 'station:browserWindow-getFocusedWindow',

  // Clipboard
  CLIPBOARD_WRITE_TEXT: 'station:clipboard-writeText',
  CLIPBOARD_READ_TEXT: 'station:clipboard-readText',

  // Custom dock icon
  APPLICATIONS_PICK_CUSTOM_ICON: 'station:applications-pickCustomIcon',
  APPLICATIONS_REMOVE_CUSTOM_ICON: 'station:applications-removeCustomIcon',

  // getGlobal
  GET_GLOBAL: 'station:getGlobal',

  // webFrame
  WEBFRAME_SET_VISUAL_ZOOM_LEVEL_LIMITS: 'station:webFrame-setVisualZoomLevelLimits',
};

// ====== Helper: create async IPC invoke wrapper ======
function invoke(channel, ...args) {
  return ipcRenderer.invoke(channel, ...args);
}

function send(channel, ...args) {
  ipcRenderer.send(channel, ...args);
}

function sendSync(channel, ...args) {
  return ipcRenderer.sendSync(channel, ...args);
}

const IPC_SEND_CHANNELS = new Set([
  'bx-ready-to-show',
  'get-is-packaged',
  'get-worker-contents-id-sync',
  'station:webcontents:before-input-event:subscribe',
  'bx-api-perform',
  'bx-api-subscribe',
  'bx-api-response',
  'stream-electron-ipc.get-current-web-contents-id',
  'bx-redux',
  'bx-services',
  'bx-services-worker-main',
  'data',
]);

const IPC_INVOKE_CHANNELS = new Set([
  'get-worker-contents-id',
]);

const IPC_LISTEN_CHANNELS = new Set([
  'station:webcontents:before-input-event',
  'bx-redux',
  'bx-services',
  'bx-services-worker-main',
  'data',
]);

function isAllowedIpcChannel(channel, allowed) {
  return allowed.has(channel) || channel.startsWith('sei-');
}

function assertAllowedIpcChannel(channel, allowed, operation) {
  if (typeof channel !== 'string' || !isAllowedIpcChannel(channel, allowed)) {
    throw new Error(`Blocked window.station.ipc.${operation} for channel: ${channel}`);
  }
}

const ipcListenerMap = new Map();

function getMappedIpcListener(channel, callback) {
  const listeners = ipcListenerMap.get(channel);
  return listeners ? listeners.get(callback) : undefined;
}

function setMappedIpcListener(channel, callback, handler) {
  let listeners = ipcListenerMap.get(channel);
  if (!listeners) {
    listeners = new WeakMap();
    ipcListenerMap.set(channel, listeners);
  }
  listeners.set(callback, handler);
}

// ====== Auto-register window events with main process ======
let windowEventsRegistered = false;
function ensureWindowEventsRegistered() {
  if (!windowEventsRegistered) {
    windowEventsRegistered = true;
    ipcRenderer.send('station:window-register-events');
  }
}

// ====== Build the API object ======
const station = {
  ipc: {
    send: (channel, ...args) => {
      assertAllowedIpcChannel(channel, IPC_SEND_CHANNELS, 'send');
      return ipcRenderer.send(channel, ...args);
    },
    sendSync: (channel, ...args) => {
      assertAllowedIpcChannel(channel, IPC_SEND_CHANNELS, 'sendSync');
      return ipcRenderer.sendSync(channel, ...args);
    },
    invoke: (channel, ...args) => {
      assertAllowedIpcChannel(channel, IPC_INVOKE_CHANNELS, 'invoke');
      return ipcRenderer.invoke(channel, ...args);
    },
    on: (channel, callback) => {
      assertAllowedIpcChannel(channel, IPC_LISTEN_CHANNELS, 'on');
      const handler = (_event, ...args) => callback(...args);
      setMappedIpcListener(channel, callback, handler);
      ipcRenderer.on(channel, handler);
      return () => ipcRenderer.removeListener(channel, handler);
    },
    once: (channel, callback) => {
      assertAllowedIpcChannel(channel, IPC_LISTEN_CHANNELS, 'once');
      return ipcRenderer.once(channel, (_event, ...args) => callback(...args));
    },
    removeListener: (channel, callback) => {
      assertAllowedIpcChannel(channel, IPC_LISTEN_CHANNELS, 'removeListener');
      return ipcRenderer.removeListener(channel, getMappedIpcListener(channel, callback) || callback);
    },
  },

  app: {
    getName: () => sendSync(IPC.APP_GET_NAME),
    getVersion: () => sendSync(IPC.APP_GET_VERSION),
    getPath: (name) => sendSync(IPC.APP_GET_PATH, name),
    isPackaged: () => sendSync(IPC.APP_IS_PACKAGED),
    exit: (code) => send(IPC.APP_EXIT, code),
    quit: () => send(IPC.APP_QUIT),
  },

  shell: {
    openExternal: (url) => invoke(IPC.SHELL_OPEN_EXTERNAL, url),
    openPath: (path) => invoke(IPC.SHELL_OPEN_PATH, path),
  },

  window: {
    close: () => send(IPC.WINDOW_CLOSE),
    minimize: () => send(IPC.WINDOW_MINIMIZE),
    maximize: () => send(IPC.WINDOW_MAXIMIZE),
    unmaximize: () => send(IPC.WINDOW_UNMAXIMIZE),
    focus: () => send(IPC.WINDOW_FOCUS),
    isFocused: () => invoke(IPC.WINDOW_IS_FOCUSED),
    isFullScreen: () => invoke(IPC.WINDOW_IS_FULLSCREEN),
    isMaximized: () => invoke(IPC.WINDOW_IS_MAXIMIZED),
    setFullScreen: (flag) => send(IPC.WINDOW_SET_FULLSCREEN, flag),
    toggleFullScreen: () => send(IPC.WINDOW_TOGGLE_FULLSCREEN),
    resetPosition: () => send(IPC.WINDOW_RESET_POSITION),
    getId: () => sendSync(IPC.WINDOW_GET_ID),
    getSubData: () => sendSync(IPC.WINDOW_GET_SUB_DATA),
    onFocus: (callback) => {
      ensureWindowEventsRegistered();
      const handler = () => callback();
      ipcRenderer.on(IPC.WINDOW_ON_FOCUS, handler);
      return () => ipcRenderer.removeListener(IPC.WINDOW_ON_FOCUS, handler);
    },
    onBlur: (callback) => {
      ensureWindowEventsRegistered();
      const handler = () => callback();
      ipcRenderer.on(IPC.WINDOW_ON_BLUR, handler);
      return () => ipcRenderer.removeListener(IPC.WINDOW_ON_BLUR, handler);
    },
    onClose: (callback) => {
      ensureWindowEventsRegistered();
      const handler = () => callback();
      ipcRenderer.on(IPC.WINDOW_ON_CLOSE, handler);
      return () => ipcRenderer.removeListener(IPC.WINDOW_ON_CLOSE, handler);
    },
  },

  webContents: {
    getCurrentId: () => sendSync(IPC.WEBCONTENTS_GET_CURRENT_ID),
    openDevTools: () => send(IPC.WEBCONTENTS_OPEN_DEV_TOOLS),
    fromId: (id) => invoke(IPC.WEBCONTENTS_FROM_ID, id),
  },

  dialog: {
    showMessageBox: (options) => invoke(IPC.DIALOG_SHOW_MESSAGE_BOX, options),
  },

  browserWindow: {
    getFocusedWindow: () => invoke(IPC.BROWSER_WINDOW_GET_FOCUSED),
  },

  clipboard: {
    writeText: (text) => send(IPC.CLIPBOARD_WRITE_TEXT, text),
    readText: () => sendSync(IPC.CLIPBOARD_READ_TEXT),
    write: (data) => invoke('station:clipboard-write', data),
  },

  getGlobal: (name) => sendSync(IPC.GET_GLOBAL, name),

  webFrame: {
    setVisualZoomLevelLimits: (min, max) => webFrame.setVisualZoomLevelLimits(min, max),
  },
};

// ====== Expose API to renderer ======
if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('require', (moduleName) => nodeRequire(moduleName));
  contextBridge.exposeInMainWorld('__dirname', rendererDirname);
  contextBridge.exposeInMainWorld('__filename', path.join(rendererDirname, 'mainRenderer.js'));
  contextBridge.exposeInMainWorld('process', {
    env: process.env,
    type: process.type,
    platform: process.platform,
    arch: process.arch,
    versions: process.versions,
    cwd: () => process.cwd(),
    nextTick: (callback, ...args) => process.nextTick(callback, ...args),
    on: (eventName, listener) => {
      process.on(eventName, listener);
      return () => process.removeListener(eventName, listener);
    },
    once: (eventName, listener) => process.once(eventName, listener),
    removeListener: (eventName, listener) => process.removeListener(eventName, listener),
  });
  contextBridge.exposeInMainWorld('station', station);
} else {
  window.require = nodeRequire;
  window.__dirname = rendererDirname;
  window.__filename = path.join(rendererDirname, 'mainRenderer.js');
  window.process = process;
  window.station = station;
}

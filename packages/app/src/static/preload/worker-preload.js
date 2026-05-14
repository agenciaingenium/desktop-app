/**
 * Worker preload: injects window.station polyfill.
 *
 * The worker window uses nodeIntegration:true + contextIsolation:false,
 * so it can require('electron') directly. This preload sets up window.station
 * before any renderer code runs, so shared modules (stream-ipc-proxy, etc.)
 * that reference window.station.ipc work without contextBridge.
 */

const { ipcRenderer, shell, clipboard, webFrame } = require('electron');

window.station = {
  ipc: {
    send: ipcRenderer.send.bind(ipcRenderer),
    sendSync: ipcRenderer.sendSync.bind(ipcRenderer),
    invoke: ipcRenderer.invoke.bind(ipcRenderer),
    on: ipcRenderer.on.bind(ipcRenderer),
    once: ipcRenderer.once.bind(ipcRenderer),
    removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
  },
  app: {
    getName: () => ipcRenderer.sendSync('station:app-getName'),
    getVersion: () => ipcRenderer.sendSync('station:app-getVersion'),
    getPath: (p) => ipcRenderer.sendSync('station:app-getPath', p),
    isPackaged: () => ipcRenderer.sendSync('station:app-isPackaged'),
  },
  shell: {
    openExternal: (url) => shell.openExternal(url),
    openPath: (p) => shell.openPath(p),
  },
  clipboard: {
    write: (data) => clipboard.write(data),
    writeText: (text) => clipboard.writeText(text),
    readText: () => clipboard.readText(),
  },
  window: {
    close: () => { ipcRenderer.send('station:window-close'); },
    minimize: () => { ipcRenderer.send('station:window-minimize'); },
    focus: () => { ipcRenderer.send('station:window-focus'); },
    isFocused: () => ipcRenderer.invoke('station:window-isFocused'),
    isFullScreen: () => ipcRenderer.invoke('station:window-isFullScreen'),
    setFullScreen: (flag) => { ipcRenderer.send('station:window-setFullScreen', flag); },
    onBlur: (cb) => { ipcRenderer.on('station:window-on-blur', cb); return () => ipcRenderer.removeListener('station:window-on-blur', cb); },
    onFocus: (cb) => { ipcRenderer.on('station:window-on-focus', cb); return () => ipcRenderer.removeListener('station:window-on-focus', cb); },
    getId: () => ipcRenderer.sendSync('station:window-getId'),
    getSubData: () => undefined,
  },
  webFrame: {
    setVisualZoomLevelLimits: (min, max) => webFrame.setVisualZoomLevelLimits(min, max),
  },
};

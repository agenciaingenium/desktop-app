/**
 * CLI window preload script.
 *
 * Exposes a minimal `window.station` API for the CLI (Mermaid SVG generation)
 * window, enabling contextIsolation=true and nodeIntegration=false.
 */

const { contextBridge, ipcRenderer } = require('electron');

const station = {
  ipc: {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    sendSync: (channel, ...args) => ipcRenderer.sendSync(channel, ...args),
    on: (channel, callback) => {
      const handler = (_event, ...args) => callback(...args);
      ipcRenderer.on(channel, handler);
      return () => ipcRenderer.removeListener(channel, handler);
    },
    once: (channel, callback) => {
      ipcRenderer.once(channel, (_event, ...args) => callback(...args));
    },
    removeListener: (channel, callback) => {
      ipcRenderer.removeListener(channel, callback);
    },
  },

  app: {
    exit: (code) => ipcRenderer.send('station:app-exit', code),
  },

  // Access to shared global objects passed from the main process
  getGlobal: (name) => ipcRenderer.sendSync('station:getGlobal', name),

  // File system operations needed by CLI
  fs: {
    readFileSync: (filePath, encoding) =>
      ipcRenderer.sendSync('station:fs-readFileSync', filePath, encoding),
    writeFileSync: (filePath, data) =>
      ipcRenderer.sendSync('station:fs-writeFileSync', filePath, data),
  },
};

contextBridge.exposeInMainWorld('station', station);
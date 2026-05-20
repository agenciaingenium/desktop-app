/**
 * Main process IPC handlers for the station preload bridge.
 *
 * These handlers implement the server side of the window.station API
 * exposed to the renderer via contextBridge in main-preload.js.
 */

import { app, ipcMain, shell, dialog, clipboard, BrowserWindow, webContents } from 'electron';
import * as fs from 'fs';
import { openExternal } from '../utils/shell';

/**
 * Get the BrowserWindow that sent the IPC message.
 */
function getSenderWindow(event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

let registered = false;

export function _resetRegistration() {
  registered = false;
}

export function registerStationIpcHandlers() {
  if (registered) return;
  registered = true;
  // ====== App ======
  ipcMain.on('station:app-getName', (event) => {
    event.returnValue = app.name;
  });

  ipcMain.on('station:app-getVersion', (event) => {
    event.returnValue = app.getVersion();
  });

  ipcMain.on('station:app-getPath', (event, name: string) => {
    event.returnValue = app.getPath(name as any);
  });

  ipcMain.on('station:app-isPackaged', (event) => {
    event.returnValue = app.isPackaged;
  });

  ipcMain.on('station:app-exit', (_event, code?: number) => {
    app.exit(code);
  });

  ipcMain.on('station:app-quit', () => {
    app.quit();
  });

  // ====== Shell ======
  ipcMain.handle('station:shell-openExternal', async (_event, url: string) => {
    return openExternal(url);
  });

  ipcMain.handle('station:shell-openPath', async (_event, path: string) => {
    return shell.openPath(path);
  });

  // ====== Window (current BrowserWindow) ======
  ipcMain.on('station:window-close', (event) => {
    const win = getSenderWindow(event);
    if (win) win.close();
  });

  ipcMain.on('station:window-minimize', (event) => {
    const win = getSenderWindow(event);
    if (win) win.minimize();
  });

  ipcMain.on('station:window-maximize', (event) => {
    const win = getSenderWindow(event);
    if (win) win.maximize();
  });

  ipcMain.on('station:window-unmaximize', (event) => {
    const win = getSenderWindow(event);
    if (win) win.unmaximize();
  });

  ipcMain.on('station:window-focus', (event) => {
    const win = getSenderWindow(event);
    if (win) win.focus();
  });

  ipcMain.handle('station:window-isFocused', async (event) => {
    const win = getSenderWindow(event);
    return win ? win.isFocused() : false;
  });

  ipcMain.handle('station:window-isFullScreen', async (event) => {
    const win = getSenderWindow(event);
    return win ? win.isFullScreen() : false;
  });

  ipcMain.handle('station:window-isMaximized', async (event) => {
    const win = getSenderWindow(event);
    return win ? win.isMaximized() : false;
  });

  ipcMain.on('station:window-setFullScreen', (event, flag: boolean) => {
    const win = getSenderWindow(event);
    if (win) win.setFullScreen(flag);
  });

  ipcMain.on('station:window-toggleFullScreen', (event) => {
    const win = getSenderWindow(event);
    if (win) win.setFullScreen(!win.isFullScreen());
  });

  ipcMain.on('station:window-resetPosition', (event) => {
    const win = getSenderWindow(event);
    if (win && typeof (win as any).resetWindowPosition === 'function') {
      (win as any).resetWindowPosition();
    }
  });

  ipcMain.on('station:window-getId', (event) => {
    const win = getSenderWindow(event);
    event.returnValue = win ? win.id : -1;
  });

  ipcMain.on('station:window-getSubData', (event) => {
    const win = getSenderWindow(event);
    event.returnValue = win ? (win as any).subData : undefined;
  });

  // Window events - forward focus/blur/close events from main to renderer
  ipcMain.on('station:window-register-events', (event) => {
    const win = getSenderWindow(event);
    if (!win) return;

    const senderWebContents = event.sender;

    const onFocus = () => {
      if (!senderWebContents.isDestroyed()) {
        senderWebContents.send('station:window-on-focus');
      }
    };

    const onBlur = () => {
      if (!senderWebContents.isDestroyed()) {
        senderWebContents.send('station:window-on-blur');
      }
    };

    const onClose = () => {
      if (!senderWebContents.isDestroyed()) {
        senderWebContents.send('station:window-on-close');
      }
    };

    win.on('focus', onFocus);
    win.on('blur', onBlur);
    win.on('close', onClose);

    // Clean up when webContents is destroyed
    senderWebContents.once('destroyed', () => {
      if (!win.isDestroyed()) {
        win.removeListener('focus', onFocus);
        win.removeListener('blur', onBlur);
        win.removeListener('close', onClose);
      }
    });
  });

  // ====== WebContents ======
  ipcMain.on('station:webcontents-getCurrentId', (event) => {
    event.returnValue = event.sender.id;
  });

  // Subscribe to before-input-event on a specific webContents and forward to the requesting renderer
  ipcMain.on('station:webcontents:before-input-event:subscribe', (event, webContentsId: number) => {
    const wc = webContents.fromId(webContentsId);
    if (!wc || wc.isDestroyed()) return;

    const senderWebContents = event.sender;
    const handler = (_event: any, input: any) => {
      if (!senderWebContents.isDestroyed()) {
        senderWebContents.send('station:webcontents:before-input-event', webContentsId, input);
      }
    };

    wc.on('before-input-event', handler);

    // Clean up when the requesting renderer is destroyed
    senderWebContents.once('destroyed', () => {
      if (!wc.isDestroyed()) {
        wc.removeListener('before-input-event', handler);
      }
    });
  });

  ipcMain.on('station:webcontents-openDevTools', (event) => {
    event.sender.openDevTools();
  });

  ipcMain.handle('station:webContents-fromId', async (_event, id: number) => {
    const wc = webContents.fromId(id);
    if (!wc) return null;
    return { id: wc.id, destroyed: wc.isDestroyed() };
  });

  // ====== Dialog ======
  ipcMain.handle('station:dialog-showMessageBox', async (_event, options: Electron.MessageBoxOptions) => {
    return dialog.showMessageBox(options);
  });

  // ====== BrowserWindow ======
  ipcMain.handle('station:browserWindow-getFocusedWindow', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;
    return { id: win.id };
  });

  // ====== Clipboard ======
  ipcMain.on('station:clipboard-writeText', (_event, text: string) => {
    clipboard.writeText(text);
  });

  ipcMain.on('station:clipboard-readText', (event) => {
    event.returnValue = clipboard.readText();
  });

  ipcMain.handle('station:clipboard-write', async (_event, data: { text?: string; bookmark?: string }) => {
    clipboard.write(data);
  });

  // ====== getGlobal ======
  ipcMain.on('station:getGlobal', (event, name: string) => {
    event.returnValue = (global as any)[name];
  });

  // ====== File system (CLI window only) ======
  ipcMain.on('station:fs-readFileSync', (event, filePath: string, encoding?: string) => {
    try {
      event.returnValue = encoding ? fs.readFileSync(filePath, encoding as BufferEncoding) : fs.readFileSync(filePath);
    } catch (err) {
      event.returnValue = null;
    }
  });

  ipcMain.on('station:fs-writeFileSync', (event, filePath: string, data: string) => {
    try {
      fs.writeFileSync(filePath, data);
      event.returnValue = true;
    } catch (err) {
      event.returnValue = false;
    }
  });
}

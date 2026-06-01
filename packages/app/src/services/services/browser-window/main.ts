import { BrowserWindow, ipcMain, screen } from 'electron';
import * as windowStateKeeper from 'electron-window-state';
import { fromEvent } from 'rxjs';
import * as path from 'path';
import { NotificationProps } from '../../../notification-center/types';
import { ServiceSubscription } from '../../lib/class';
import { RPC } from '../../lib/types';
import { BrowserWindowService, BrowserWindowServiceConstructorOptions, BrowserWindowServiceObserver } from './interface';

const noop = () => {};

// Preload script path for the main renderer (enables contextBridge)
const mainPreloadPath = path.join(__dirname, 'main-preload.js');

export class BrowserWindowServiceImpl extends BrowserWindowService implements RPC.Interface<BrowserWindowService> {

  public window: Electron.BrowserWindow;
  protected stateManager?: windowStateKeeper.State;

  constructor(options: BrowserWindowServiceConstructorOptions) {
    super();
    const positionOptions = this.startInitPositionManager(options.savePosition);

    // If the caller explicitly requests contextIsolation, inject the preload script.
    // Keep this renderer in the legacy Node context for now: the renderer bundle
    // still externalizes many CommonJS dependencies and expects native require(),
    // process, __dirname, and class prototypes at runtime.
    const callerWebPrefs = options.webPreferences || {};
    const usePreload = callerWebPrefs.contextIsolation === true;

    const webPreferences = usePreload
      ? {
          ...callerWebPrefs,
          preload: mainPreloadPath,
          contextIsolation: false,
        }
      : callerWebPrefs;

    this.window = new BrowserWindow({
      ...positionOptions,
      ...options,
      webPreferences,
    });

    // NOTE: @electron/remote has been removed from the project. Renderer code
    // uses window.station.* API (exposed via contextBridge in main-preload.js).

    if (options.preventNavigation) {
      this.window.webContents.on('will-navigate', event => event.preventDefault());
    }
    this.window.once('closed', () => {
      setTimeout(() => this.destroy(), 1000);
    });
    this.endInitPositionManager();
  }

  async getId() {
    if (!this.window) return 0;
    return this.window.id;
  }

  async getWebContentsId() {
    if (!this.window) return 0;
    return this.window.webContents.id;
  }

  async focus() {
    if (!this.window) return;
    this.window.focus();
  }

  async close() {
    if (!this.window) return;
    this.window.close();
  }

  async show() {
    if (!this.window) return;
    this.window.show();
  }

  async hide() {
    if (!this.window) return;
    this.window.hide();
  }

  async load(url: string) {
    if (!this.window) return;
    try {
      await this.window.loadURL(url);
    } catch (err) {
      console.error('[browser-window] loadURL failed:', err);
    }
  }

  async reload() {
    if (!this.window) return;
    this.window.webContents.reload();
  }

  async openDevTools() {
    if (!this.window) return;
    try {
      await this.window.webContents.openDevTools();
    } catch (err) {
      console.error('[browser-window] openDevTools failed:', err);
    }
  }

  async toggleDevTools() {
    if (!this.window) return;
    try {
      await this.window.webContents.toggleDevTools();
    } catch (err) {
      console.error('[browser-window] toggleDevTools failed:', err);
    }
  }

  async toggleFullscreen() {
    if (!this.window) return;
    this.window.setFullScreen(!this.window.isFullScreen());
  }

  async toggleMaximize() {
    if (!this.window) return;
    if (this.window.isMaximized()) {
      this.window.unmaximize();
    } else {
      this.window.maximize();
    }
  }

  async resetWindowPosition() {
    if (!this.window) return;

    if (this.stateManager) {
      (this.stateManager as any).resetStateToDefault();
      this.stateManager.saveState(this.window);
    }

    const screenSize = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
    this.window.setPosition(screenSize.x, screenSize.y);

    if (this.stateManager) {
      this.window.setSize(this.stateManager.width, this.stateManager.height);
    }
  }

  async getBounds() {
    if (!this.window) return { x: 0, y: 0, width: 0, height: 0 };
    return this.window.getBounds();
  }

  async isFocused() {
    if (!this.window) return false;
    return this.window.isFocused();
  }

  /**
   * Data attached by the main process on the `window` object can be read directly by the process in question.
   * Used mainly by Subwindows.
   * @param metadata
   */
  async setMetadata<T extends object>(metadata: T) {
    if (!this.window) return;
    Object.assign(this.window, metadata);
  }

  async addObserver(obs: RPC.ObserverNode<BrowserWindowServiceObserver>) {
    return new ServiceSubscription([
      this.onAny('focus', obs.onFocus),
      this.onAny('blur', obs.onBlur),
      this.onAny('show', obs.onShow),
      this.onAny('beforeunload', obs.onBeforeUnload),
      this.onAny('closed', obs.onClosed),
      this.onAny('enter-full-screen', obs.onEnterFullScreen),
      this.onAny('leave-full-screen', obs.onLeaveFullScreen),
      this.onAny('minimize', obs.onMinimize),
      this.onAnyWebContents('did-finish-load', obs.onDidFinishLoad),
      this.onReadyToShow(obs.onReadyToShow),
      this.onContextMenu(obs.onContextMenu),
      this.onSwipe(obs.onSwipe),
      this.onNewNotification(obs.onNewNotification),
    ], obs, this);
  }

  private onAny(key: string, callback?: Function) {
    if (!callback || !this.window) return noop;
    return fromEvent(this.window as any, key).subscribe(() => callback());
  }

  private onAnyWebContents(key: string, callback?: Function) {
    if (!callback || !this.window) return noop;
    return fromEvent(this.window.webContents as any, key).subscribe(() => callback());
  }

  private onContextMenu(callback?: RPC.ObserverNode<BrowserWindowServiceObserver>['onContextMenu']) {
    if (!callback || !this.window) return noop;
    return fromEvent(this.window.webContents as any, 'context-menu', (_e: any, params: any) => params).subscribe(callback);
  }

  private onSwipe(callback?: RPC.ObserverNode<BrowserWindowServiceObserver>['onSwipe']) {
    if (!callback || !this.window) return noop;
    return fromEvent(this.window as any, 'swipe', (_e: any, direction: any) => direction).subscribe(callback);
  }

  private onReadyToShow(callback?: Function) {
    if (!callback || !this.window) return noop;
    const cb = (event: Electron.IpcMainEvent) => {
      if (event.sender === this.window.webContents) {
        callback();
        ipcMain.removeListener('bx-ready-to-show', cb);
      }
    };
    ipcMain.on('bx-ready-to-show', cb);

    return () => ipcMain.removeListener('bx-ready-to-show', cb);
  }

  private onNewNotification(callback?: Function) {
    if (!callback || !this.window) return noop;
    const cb = (event: Electron.IpcMainEvent, notificationId: string, props: NotificationProps) => {
      if (event.sender === this.window.webContents) {
        callback(notificationId, props);
      }
    };
    ipcMain.on('new-notification', cb);

    return () => ipcMain.removeListener('new-notification', cb);
  }

  private startInitPositionManager(savePosition?: string): Partial<BrowserWindowServiceConstructorOptions> {
    if (!savePosition) return {};
    // @ts-ignore no declaration file
    const sanitize = require('sanitize-filename');
    const sanitizedFilename = sanitize(savePosition);
    if (!sanitizedFilename) throw new Error(`Invalid file name ${savePosition}`);

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    // @ts-ignore no declaration file
    this.stateManager = windowStateKeeper({
      defaultWidth: width - 40,
      defaultHeight: height - 40,
      file: `${sanitizedFilename}.json`,
      // Never restore fullscreen state to avoid issues when closing in fullscreen
      fullScreen: false,
    });

    if (!this.stateManager) {
      return {};
    }

    return {
      x: this.stateManager.x,
      y: this.stateManager.y,
      center: !this.stateManager.x && !this.stateManager.y,
      width: this.stateManager.width > 5 ? this.stateManager.width : 1024,
      height: this.stateManager.height > 5 ? this.stateManager.height : 728,
      // Explicitly disable fullscreen on startup
      fullscreen: false,
    };
  }

  private endInitPositionManager() {
    if (!this.stateManager || !this.window) return;
    this.stateManager.manage(this.window);

    if (this.window.isFullScreen()) {
      this.window.setFullScreen(false);
    }
  }

  async setAlwaysOnTop(flag: boolean, level?: 'normal' | 'floating' | 'torn-off-menu' | 'modal-panel' | 'main-menu' | 'status' | 'pop-up-menu' | 'screen-saver', relativeLevel?: number) {
    try {
      await this.window.setAlwaysOnTop(flag, level, relativeLevel);
    } catch (err) {
      console.error('[browser-window] setAlwaysOnTop failed:', err);
    }
  }
}

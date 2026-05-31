import { EventEmitter } from 'events';
import { Action, Store } from 'redux';

import { changeAppFocusState } from '../../app/duck';
import { NotificationProps } from '../../notification-center/types';
import { handleError } from '../../services/api/helpers';
import { observer } from '../../services/lib/helpers';
import { RPC } from '../../services/lib/types';
import { BrowserWindowService, BrowserWindowServiceConstructorOptions } from '../../services/services/browser-window/interface';
import services from '../../services/servicesManager';
import { isPackaged } from '../../utils/env';
import { windowCreated, windowDeleted } from '../duck';

let allowDispatch = true;
services.electronApp
  .addObserver(
    observer(
      {
        onBeforeQuit() {
          allowDispatch = false;
        },
      },
      'gwm-quit'
    )
  )
  .catch(handleError());

export default class GenericWindowManager extends EventEmitter {

  public static store: Store<any>;
  protected static FILEPATH: string;
  public window?: RPC.Node<BrowserWindowService>;
  public windowId?: number;

  static dispatch(a: Action) {
    if (allowDispatch && GenericWindowManager.store) {
      GenericWindowManager.store.dispatch(a);
    }
  }

  static focus(webviewId: number) {
    return services.browserWindow.focus(webviewId).catch(
      handleError({
        console: false,
        log: true,
      })
    );
  }

  isCreated(): this is Required<GenericWindowManager> {
    return Boolean(this.window);
  }

  async close() {
    if (this.isCreated()) await this.window.close();
  }

  async show() {
    if (this.isCreated()) {
      await this.window.show();
      setTimeout(async () => {
        if (!this.window) return;
        try {
          await this.window.focus();
        } catch (err) {
          console.error('[GenericWindowManager] focus failed:', err);
        }
      }, 1000);
    }
  }

  async focus() {
    if (!this.window) return;
    try {
      await this.window.focus();
    } catch (err) {
      console.error('[GenericWindowManager] focus failed:', err);
    }
  }

  async create(options: BrowserWindowServiceConstructorOptions, shownow: boolean = false) {
    if (this.isCreated()) return this.window;

    try {
      this.window = await services.browserWindow.create({
        ...options,
        preventNavigation: true,
        webPreferences: {
          nodeIntegration: true,
          webviewTag: true,
          webSecurity: false,
          allowRunningInsecureContent: false,
          contextIsolation: true,
          sandbox: false,
        },
      });
    } catch (err) {
      console.error('[GenericWindowManager] create failed:', err);
      throw err;
    }

    this.emit('window-created');
    this.windowId = await this.window.getId();
    const webContentsId = await this.window.getWebContentsId();

    const self = this;

    this.window.addObserver(
      observer(
        {
          onReadyToShow() {
            self.show();
            if (!isPackaged) {
              self.window && self.window.openDevTools();
            }
          },
          onShow() {
            self.emit('shown');
          },
          onBeforeUnload() {
            self.emit('beforeunload');
          },
          onDidFinishLoad() {
            self.emit('loaded');
          },
          onClosed() {
            if (self.windowId !== undefined) {
              GenericWindowManager.dispatch(windowDeleted(self.windowId));
            }
            self.window = undefined;
            self.windowId = undefined;
            self.emit('closed');
          },
          onEnterFullScreen() {
            self.emit('enter-full-screen');
          },
          onLeaveFullScreen() {
            self.emit('leave-full-screen');
          },
          onFocus() {
            self.emit('focus');
          },
          onBlur() {
            self.emit('blur');
          },
          onSwipe(direction: 'up' | 'right' | 'down' | 'left') {
            self.emit(`swipe-${direction}`);
          },
          onContextMenu(params: Electron.ContextMenuParams) {
            self.emit('context-menu', params);
          },
          onNewNotification(notificationId: string, props: NotificationProps) {
            self.emit('new-notification', notificationId, props, {
              webContentsId,
            });
          },
          onMinimize() {
            self.emit('minimize');
          }
        },
        'gwm'
      )
    );

    if (shownow) {
      await this.show();
    }

    this.initFocusWatcher();
    this.initDispatch();

    return this.window;
  }

  load(filepath?: string) {
    if (!this.window) return;
    const fp = filepath || (<typeof GenericWindowManager>this.constructor).FILEPATH;
    if (!fp) throw new Error(`Invalid loadURL parameter: ${fp}`);
    return this.window.load(fp);
  }

  initFocusWatcher() {
    this.on('blur', () => {
      GenericWindowManager.dispatch(changeAppFocusState(null));
    });

    this.on('focus', () => {
      setTimeout(async () => {
        try {
          if (this.window && (await this.window.isFocused())) {
            GenericWindowManager.dispatch(changeAppFocusState(this.windowId));
          }
        } catch (err) {
          console.error('[GenericWindowManager] focus check failed:', err);
        }
      }, 1);
    });
  }

  initDispatch() {
    GenericWindowManager.dispatch(windowCreated(this.windowId));
  }

  reload() {
    if (!this.isCreated()) return Promise.resolve();
    return this.window.reload();
  }

  toggleDevTools() {
    if (!this.isCreated()) return Promise.resolve();
    return this.window.toggleDevTools();
  }

  toggleFullscreen() {
    if (!this.isCreated()) return Promise.resolve();
    return this.window.toggleFullscreen();
  }

  hide() {
    if (!this.isCreated()) return Promise.resolve();
    return this.window.hide();
  }
}

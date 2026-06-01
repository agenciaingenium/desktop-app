import { EventEmitter } from 'events';
import { parse } from 'url';
import { app, webContents, BrowserWindow, Menu, Tray, nativeImage, session as electronSession } from 'electron';
import log from 'electron-log';

import services from './services/servicesManager';
import { observer } from './services/lib/helpers';
import { handleError } from './services/api/helpers';
import { start } from './webui/webUIHandler';
import { enhanceSession, requestMacOSMediaAccess } from './session';

// Pre-grant microphone/camera on macOS once so the OS-level prompt appears
// at app start instead of being re-triggered by every webview getUserMedia call
app.on('ready', () => {
  requestMacOSMediaAccess().catch(handleError({ console: false, log: true }));
});

// Enhance the default session early so permission handlers are ready
// before any webContents try to request media access
app.on('ready', () => {
  enhanceSession(electronSession.defaultSession);
});

export default class BrowserXAppMain extends EventEmitter {

  init() {
    this.initAppLifeCycle();
    this.initProcessManagerAnalytics().catch(handleError());
    this.initWebUIHandler();
  }

  initAppLifeCycle() {
    app.on('ready', async () => {
      // can register a onOpen function that should return a promise
      if (typeof this.onOpen === 'function') {
        await this.onOpen();
      }
    });
    app.on('session-created', (session) => {
      enhanceSession(session);
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async initProcessManagerAnalytics() {
    const onWillKillProcess = ({ pid }) => {
      const wc = webContents.getAllWebContents().find(w => w.getOSProcessId() === pid);
      if (!wc) return;

      const url = parse(wc.getURL());

      log.info('Will kill process', pid, url.host);
    };
    return services.processManager.addObserver(observer({ onWillKillProcess }));
  }

  initWebUIHandler() {
    app.on('ready', () => {
      start();
    });
  }
}

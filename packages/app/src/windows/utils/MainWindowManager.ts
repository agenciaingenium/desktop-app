import { getUrlToLoad } from '../../utils/dev';
import { isDarwin } from '../../utils/process';
import { getResourceIconPath } from '../../utils/resources';
// @ts-ignore: no declaration file
import { windowCreated } from '../duck';
import GenericWindowManager from './GenericWindowManager';
import services from '../../services/servicesManager';

export default class MainWindowManager extends GenericWindowManager {

  static instance: MainWindowManager;
  static FILEPATH = getUrlToLoad('main.html');

  constructor() {
    super();
    MainWindowManager.instance = this;
  }

  async create() {
    if (this.isCreated()) {
      return this.window;
    }

    console.log('[MainWindowManager] create: calling super.create');
    await super.create({
      show: true,
      ...(isDarwin
        ? { frame: true, titleBarStyle: 'hiddenInset' }
        : { frame: false }),
      icon: getResourceIconPath(),
      acceptFirstMouse: true,
      savePosition: 'main-window',
      fullscreenable: true,
      simpleFullscreen: false,
    });
    console.log('[MainWindowManager] create: super.create done, window id:', this.windowId);

    this.on('minimize', async () => {
      try {
        const trayIconVisible = await services.electronApp.trayIconVisible();
        if (trayIconVisible) {
          services.browserWindow.hideAllWindows();
        }
      } catch (err) {
        console.error('[MainWindowManager] minimize handler failed:', err);
      }
    });

    await super.load();
    console.log('[MainWindowManager] create: super.load() done, returning window');

    return this.window!;
  }

  // @overdide
  initDispatch() {
    MainWindowManager.dispatch(windowCreated(this.windowId, true));
  }
}

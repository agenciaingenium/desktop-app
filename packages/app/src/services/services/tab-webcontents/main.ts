import BluebirdPromise from 'bluebird';
import { app, ipcMain, session, HandlerDetails } from 'electron';

import { omit } from 'ramda';
import { fromEvent, Observable, Subject } from 'rxjs';
import { filter, share } from 'rxjs/operators';
import { sendToAllWebcontents } from '../../../lib/ipc-broadcast';
import { ServiceSubscription } from '../../lib/class';
import { observer } from '../../lib/helpers';
import { RPC } from '../../lib/types';
import {
  addOnCloseObserver,
  addOnDestroyedObserver,
  addOnDomReadyObserver,
  addOnNavigateObserver,
  addOnNewNotificationObserver,
  addOnNotificationCloseObserver,
  addOnPreventUnload,
  awaitDomReady,
  getWebContentsFromIdOrThrow,
  handleDownloadHack,
} from './api';
import {
  AlertDialogProviderService,
  BasicAuthDetailsProviderService,
  TabWebContentsAutoLoginDetailsProviderService,
  TabWebContentsGlobalObserver,
  TabWebContentsLifeCycleObserver,
  TabWebContentsNotificationsObserver,
  TabWebContentsPrintObserver,
  TabWebContentsService,
  UrlDispatcherProviderService,
  WebContentsOverrideProviderService,
} from './interface';
import { DEFAULT_BROWSER, DEFAULT_BROWSER_BACKGROUND } from '../../../urlrouter/constants';

export class TabWebContentsServiceImpl extends TabWebContentsService implements RPC.Interface<TabWebContentsService> {
  protected webviews: Subject<Electron.WebContents>;
  protected askAutoLogin: Subject<number>;
  protected requestId: number | null;
  protected loop: boolean;

  constructor(uuid?: string) {
    super(uuid);
    this.webviews = new Subject();
    this.askAutoLogin = new Subject();
    this.requestId = null;
    this.loop = false;
    this.initWebviewsListener();
  }

  initWebviewsListener() {
    app.on('web-contents-created', (_e: any, contents: Electron.WebContents) => {
      try {
        if ((contents as any).getType() === 'webview') {
          this.webviews.next(contents);
        }
      } catch (err) {
        console.error('[tab-webcontents] initWebviewsListener error:', err);
      }
    });
  }

  async clearHistory(webContentsId: number) {
    try {
      (await getWebContentsFromIdOrThrow(webContentsId)).clearHistory();
    } catch (err) {
      console.error('[tab-webcontents] clearHistory failed:', err);
    }
  }

  async loadURL(webContentsId: number, url: string) {
    try {
      await (await getWebContentsFromIdOrThrow(webContentsId)).loadURL(url);
    } catch (err) {
      console.error('[tab-webcontents] loadURL failed:', err);
    }
  }

  async querySpellchecker(webContentsId: number, misspelledWord: string) {
    try {
      const wc = await getWebContentsFromIdOrThrow(webContentsId);

      return await ((BluebirdPromise as any)((resolve: any) => {
        ipcMain.once('spellchecker-get-correction-response', (_e: any, corrections: string[]) => resolve(corrections));
        wc.send('spellchecker-get-correction', misspelledWord);
      })
        .timeout(200)
        .catch(BluebirdPromise.TimeoutError, () => []) as any);
    }
    catch (err) {
      console.error('[tab-webcontents] querySpellchecker failed:', err);
      return [];
    }
  }

  async print(webContentsId: number) {
    try {
      (await getWebContentsFromIdOrThrow(webContentsId)).print();
    } catch (err) {
      console.error('[tab-webcontents] print failed:', err);
    }
  }

  async setZoomLevel(webContentsId: number, zoomLevel: number) {
    try {
      (await getWebContentsFromIdOrThrow(webContentsId)).setZoomLevel(zoomLevel);
    } catch (err) {
      console.error('[tab-webcontents] setZoomLevel failed:', err);
    }
  }

// @ts-ignore
async findInPage(webContentsId: number, searchString: string, options?: Electron.FindInPageOptions) {
    try {
      const wc = await getWebContentsFromIdOrThrow(webContentsId);

      return new Promise<any>((resolve) => {
        // @ts-ignore
        if (wc.isDestroyed()) return resolve();

        wc.once('found-in-page', (_e: any, result: Electron.Result) => {
          this.loop = result.matches === result.activeMatchOrdinal;
          this.requestId = null;
          resolve(result);
        });

        let opts = options;
        if (this.loop) {
          this.loop = false;
          opts = omit(['findNext'], options);
        }
        this.requestId = wc.findInPage(searchString, opts);
      });
    } catch (err) {
      console.error('[tab-webcontents] findInPage failed:', err);
      return { remaining: 0, matchRect: undefined, activeMatchOrdinal: 0, matches: 0 };
    }
  }

  async stopFindInPage(webContentsId: number) {
    try {
      (await getWebContentsFromIdOrThrow(webContentsId)).stopFindInPage('clearSelection');
    } catch (err) {
      console.error('[tab-webcontents] stopFindInPage failed:', err);
    }
  }

  async executeJavaScript(webContentsId: number, code: string, userGesture?: boolean) {
    try {
      const wc = await getWebContentsFromIdOrThrow(webContentsId);
      await awaitDomReady(wc);
      return wc.executeJavaScript(code, userGesture);
    } catch (err) {
      console.error('[tab-webcontents] executeJavaScript failed:', err);
      return undefined;
    }
  }

  async askAutoLoginCredentials(webContentsId: number) {
    this.askAutoLogin.next(webContentsId);
  }

  // PROVIDERS

  async setAlertDialogProvider(provider: RPC.Node<AlertDialogProviderService>) {
    return new ServiceSubscription(this.onNewWebviews().subscribe(wc => {
      return fromEvent(wc as any, 'ipc-message-sync', (event: any, channel: any, props: any) => ({ event, channel, props }))
        .pipe(filter(({ channel }: any) => channel === 'window-alert') as any)
        .subscribe(async ({ event, props }: any) => {
          try {
            await provider.show(wc.id, props);
            if (event && event.sendReply) {
              event.sendReply([]);
            }
          } catch (err) {
            console.error('[tab-webcontents] setAlertDialogProvider failed:', err);
          }
        });
    }));
  }

  async setAutoLoginDetailsProvider(provider: RPC.Node<TabWebContentsAutoLoginDetailsProviderService>) {
    const shared = this.onNewWebviews().pipe(share());
    return new ServiceSubscription([
      this.askAutoLogin.subscribe(async (webContentsId: number) => {
        const wc = await getWebContentsFromIdOrThrow(webContentsId);

        const credentials = await provider.getCredentials(wc.id);
        if (!credentials) return;
        const { account, canAutoSubmit } = credentials;
        if (account) {
          wc.focus();
          wc.send('autologin-value-retrieved', account, canAutoSubmit);
        }
      }),
      shared.subscribe(wc => {
        return fromEvent(wc as any, 'ipc-message', (_e: any, channel: any) => channel)
          .pipe(filter((channel: any) => channel === 'autologin-get-credentials') as any)
          .subscribe(() => {
            return this.askAutoLoginCredentials(wc.id);
          });
      }),
      shared.subscribe(wc => {
        return fromEvent(wc as any, 'ipc-message', (_e: any, channel: any) => channel)
          .pipe(filter((channel: any) => channel === 'autologin-display-removeLinkBanner') as any)
          .subscribe(async () => {
            try {
              await provider.showRemoveLinkBanner(wc.id);
            } catch (err) {
              console.error('[tab-webcontents] showRemoveLinkBanner failed:', err);
            }
          });
      }),
      shared.subscribe(wc => {
        return fromEvent(wc as any, 'did-navigate')
          .subscribe(async () => {
            try {
              await provider.hideBanners(wc.id);
            } catch (err) {
              console.error('[tab-webcontents] hideBanners(did-navigate) failed:', err);
            }
          });
      }),
      shared.subscribe(wc => {
        return fromEvent(wc as any, 'did-navigate-in-page')
          .subscribe(async () => {
            try {
              await provider.hideBanners(wc.id);
            } catch (err) {
              console.error('[tab-webcontents] hideBanners(did-navigate-in-page) failed:', err);
            }
          });
      }),
    ]);
  }

  async setBasicAuthDetailsProvider(provider: RPC.Node<BasicAuthDetailsProviderService>) {
    return new ServiceSubscription(this.onNewWebviews().subscribe(wc => {
      return fromEvent(wc as any, 'login', (event: any, _request: any, authInfo: any, callback: any) => ({ event, authInfo, callback }))
        .subscribe(async ({ event, authInfo, callback }: any) => {
          try {
            event.preventDefault();
            const { username, password } = await provider.getAuthData(wc.id, authInfo);
            callback(username, password);
          } catch (err) {
            console.error('[tab-webcontents] getAuthData failed:', err);
          }
        });
    }));
  }

  async setWebContentsOverrideProvider(provider: RPC.Node<WebContentsOverrideProviderService>) {
    return new ServiceSubscription(this.onNewWebviews().subscribe(async wc => {
      try {
        const data = await provider.getOverrideData(wc.id);
        if (data.userAgent) {
          let userAgentWithRealOS = data.userAgent;
          const defaultUserAgent = session.defaultSession?.getUserAgent();
          const baseOSUserAgent = defaultUserAgent?.match(/\(([^()]*)\)/m);
          if (baseOSUserAgent && baseOSUserAgent.length > 1) {
            userAgentWithRealOS = data.userAgent.replace(/\(([^()]*)\)/m, baseOSUserAgent[0]);
          }
          wc.setUserAgent(userAgentWithRealOS);
        }
      } catch (err) {
        console.error('[tab-webcontents] setWebContentsOverrideProvider failed:', err);
      }
    }));
  }

  /**
   * @param details 
   * @returns true if a site wants to open a new window for user request (e.g. authorisation window) 
   */
  isNewWindowForUserRequest(details: HandlerDetails): boolean {

    if (details.url.startsWith('about:blank')
      || details.url.startsWith('https://accounts.google.com/o/oauth2/')) {
      return true;
    }

    if (details.features) {
      let noLocation = false;
      let noToolbar = false;
      let noMenubar = false;
      let popup = false;
      const trueValues = ['yes', 'true', '1'];
      const falseValues = ['no', 'false', '0'];
      for (const featureString of details.features.split(',')) {
        const pair = featureString.split('=');
        if (pair.length === 2) {
          const key = pair[0].trim().toLowerCase();
          const value = pair[1].trim().toLowerCase();
          if (key === 'location') {
            noLocation = falseValues.includes(value);
          }
          else if (key === 'toolbar') {
            noToolbar = falseValues.includes(value);
          }
          else if (key === 'menubar') {
            noMenubar = falseValues.includes(value);
          }
          else if (key === 'popup') {
            popup = trueValues.includes(value);
          }
        }
      }
      if (popup
        || noLocation && noToolbar && noMenubar) {
        return true;
      }
    }

    if (details.frameName) {
      if (!['_self', '_blank', '_parent', '_top'].includes(details.frameName)) {
        return true;
      }
    }

    return false;
  }

  async setUrlDispatcherProvider(provider: RPC.Node<UrlDispatcherProviderService>) {
    return new ServiceSubscription(this.onNewWebviews().subscribe(wc => {

      wc.setWindowOpenHandler((details: HandlerDetails) => {

        // log.debug('WindowOpen', details, process.type);

        let useDownloadHack = false;

        if (details.disposition === 'new-window') {
          if (this.isNewWindowForUserRequest(details)) {
            return { action: 'allow' };
          }
          // @ts-ignore
        provider.dispatchUrl(details.url, wc.id, DEFAULT_BROWSER_BACKGROUND);
        return { action: 'deny' };
        }
        else if (details.disposition === 'background-tab') {
          // @ts-ignore
        provider.dispatchUrl(details.url, wc.id, DEFAULT_BROWSER);
        return { action: 'deny' };
        }
        else if (details.disposition === 'foreground-tab') {
          useDownloadHack = handleDownloadHack(wc, details.url);
        }

        //vk: 2023.09.29 don't know how to verify this hack
        //    will fix it later

        // else if (disposition === 'foreground-tab' && String(url).startsWith('about:blank')) {
        //   // Gmail PDF hack. Will download a printed PDF from thumbnail
        //   // EDIT: not only Gmail or just PDF but most of the URL link on a Google app with overriden User Agent
        //   // also falls here
        //   const guest = await handleHackGoogleAppsURLs(event, options);

        //   if (guest) { // not a download
        //     const newWindowUrl = guest.webContents.getURL();
        //     if (newWindowUrl.startsWith('about:blank')) {
        //       // if popup is still blank after 2 seconds, we show it to let it finish
        //       guest.show();
        //     } else {
        //       guest.close();
        //       // otherwise dispatch the current URL of the guest window into our URLRouter
        //       await provider.dispatchUrl(newWindowUrl, wc.id);
        //     }
        //   }
        // }

        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            fullscreen: false,
            show: !useDownloadHack,
          }
        };
      });
    }));
  }

  // OBSERVERS

  async addGlobalObserver(obs: RPC.ObserverNode<TabWebContentsGlobalObserver>) {
    if (obs.onNewWebview) {
      return new ServiceSubscription(
        this.webviews.asObservable()
          .subscribe(wc => {
            obs.onNewWebview!(wc.id);
          }),
        obs
      );
    }
    return ServiceSubscription.noop;
  }

  async addLifeCycleObserver(webContentsId: number, obs: RPC.ObserverNode<TabWebContentsLifeCycleObserver>) {
    const wc = await getWebContentsFromIdOrThrow(webContentsId);

    if (wc.getMaxListeners() < 100) {
      wc.setMaxListeners(100);
    }

    const sub = new ServiceSubscription([
      addOnDestroyedObserver(wc, obs),
      addOnDomReadyObserver(wc, obs),
      addOnCloseObserver(wc, obs),
      addOnNavigateObserver(wc, obs),
      addOnPreventUnload(wc, obs),
    ], obs);

    // We already have addOnDestroyedObserver(wc, obs) above which calls obs.onDestroyed
    // Here we just need to ensure the subscription itself is cleaned up
    wc.once('destroyed', () => {
      sub.unsubscribe();
      // Can be leveraged by worker to simply know when a webcontents is destroyed
      sendToAllWebcontents(`wc-destroyed-${webContentsId}`);
    });
    return sub;
  }

  async addNotificationsObserver(webContentsId: number, obs: RPC.ObserverNode<TabWebContentsNotificationsObserver>) {
    const wc = await getWebContentsFromIdOrThrow(webContentsId);

    if (wc.getMaxListeners() < 100) {
      wc.setMaxListeners(100);
    }

    const sub = new ServiceSubscription([
      addOnNewNotificationObserver(wc, obs),
      addOnNotificationCloseObserver(wc, obs),
    ], obs);
    wc.once('destroyed', () => {
      sub.unsubscribe();
    });
    return sub;
  }

  async addPrintObserver(webContentsId: number, obs: RPC.ObserverNode<TabWebContentsPrintObserver>) {
    const wc = await getWebContentsFromIdOrThrow(webContentsId);
    if (!wc) return ServiceSubscription.noop;

    if (wc.getMaxListeners() < 100) {
      wc.setMaxListeners(100);
    }

    if (obs.onPrint) {
      const sub = new ServiceSubscription(
        fromEvent(wc as any, 'ipc-message', (_e: any, channel: any) => channel)
          .pipe(filter((channel: any) => channel === 'print') as any)
          .subscribe(() => {
            obs.onPrint!();
          }),
        obs
      );
      wc.once('destroyed', () => {
        sub.unsubscribe();
      });
      return sub;
    }
    return ServiceSubscription.noop;
  }

  // Easily use local new webviews observer as an Observable
  protected onNewWebviews() {
    return new Observable<Electron.WebContents>(o => {
      this.addGlobalObserver(observer({
        async onNewWebview(webContentsId: number) {
          const wc = await getWebContentsFromIdOrThrow(webContentsId);
          try {
            o.next(wc);
          } catch (e) {
            o.error(e);
          }
        },
      })).catch(e => o.error(e));
    });
  }
}

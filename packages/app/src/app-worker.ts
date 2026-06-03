// It is used as a global to know that we are in the worker process
process.worker = true;
import './dotenv';
import { ipcRenderer } from 'electron';
import { InMemoryCache, NormalizedCacheObject, ApolloClient, gql } from '@apollo/client';
import { PubSub } from 'graphql-subscriptions';
import { updateUI } from './ui/redux-ui-compat';
// @ts-ignore no declaration file
// @ts-ignore no declaration file
// @ts-ignore no declaration file
import { openProcessManager, setFullScreenState, setOnlineStatus, toggleKbdShortcuts } from './app/duck';
// @ts-ignore no declaration file
import { getFocus } from './app/selectors';
// @ts-ignore no declaration file
import {
  detachCurrentlyFocusedApplicationTab,
  dispatchURLNavigationActiveApp,
  resetZoomActiveApp,
  zoomInActiveApp,
  zoomOutActiveApp,
// @ts-ignore no declaration file
} from './applications/ApplicationsActions';
import { dispatchUrl } from './applications/duck';
import ManifestProvider from './applications/manifest-provider/manifest-provider';
import DistantFetcher from './applications/manifest-provider/distant-fetcher';
// @ts-ignore no declaration file
import { getForeFrontNavigationStateProperty } from './applications/utils';
// @ts-ignore no declaration file
import { setReleaseNotesSubdockVisibility } from './auto-update/duck';
import * as bang from './bang/duck';
import { AlertDialogProviderServiceImpl } from './dialogs/alertDialogProvider';
// @ts-ignore no declaration file
import * as inTabSearch from './in-tab-search/duck';
import * as notificationCenter from './notification-center/duck';
import { NotificationProps } from './notification-center/types';
import { NewNotificationOptions } from './notification-center/duck';
import { TabWebContentsAutoLoginDetailsProviderServiceImpl } from './password-managers/autoLoginProvider';
import ResourceRouterDispatcher from './resources/ResourceRouterDispatcher';
import bxSDK from './sdk';
import { handleError } from './services/api/helpers';
import { observer } from './services/lib/helpers';
import { ApolloLinkServiceImpl } from './services/services/apollo-link/worker';
import { AutolaunchProviderServiceImpl } from './services/services/autolaunch/autolaunch-provider/worker';
import { ManifestServiceImpl } from './services/services/manifest/main';
import { IMenuServiceObserverOnClickItemParam } from './services/services/menu/interface';
import { SDKv2ServiceImpl } from './services/services/sdkv2/worker';
import services from './services/servicesManager';
import { configureStore } from './store/configureStore.worker';
import { BasicAuthDetailsProviderServiceImpl } from './tab-webcontents/basicAuthDetailsProvider';
import { executeWebviewMethodForCurrentTab } from './tab-webcontents/duck';
import { WebContentsOverrideProviderServiceImpl } from './tab-webcontents/overrideProvider';
import { StationStoreWorker } from './types';
import * as ui from './ui/duck';
import { NEW_TAB } from './urlrouter/constants';
import { UrlDispatcherProviderServiceImpl } from './urlrouter/urlDispatcherProvider';
import { isPackaged } from './utils/env';
import AboutWindowManager from './windows/utils/AboutWindowManager';
import GenericWindowManager from './windows/utils/GenericWindowManager';
import MainWindowManager from './windows/utils/MainWindowManager';
import URLRouter from './urlrouter/URLRouter';
import { closeCurrentTab } from './tabs/duck';
import { BrowserWindowManagerProviderServiceImpl } from './services/services/browser-window/worker';
import { ElectronAppServiceProviderServiceImpl } from './services/services/electron-app/worker';

export class BrowserXAppWorker {
  public store!: StationStoreWorker;
  public mainWindowManager!: MainWindowManager;
  public apolloClient!: ApolloClient<NormalizedCacheObject>;
  public manifestProvider!: ManifestProvider;
  public pubsub!: PubSub;
  public router!: URLRouter;
  public resourceRouter!: ResourceRouterDispatcher;
  private onlineHandler?: () => void;
  private offlineHandler?: () => void;

  constructor() {
    try {
      this.initStore();
      this.initManifestProvider();
      this.pubsub = new PubSub();
      this.initRouter();
      this.initResourceRouter();
      this.initApolloLink();
      this.initWindowManager();
      this.initSDK();
      this.initAppLifeCycle().catch(handleError());
      this.initOnlineListener();
      this.initMenu();
      this.initContextMenu();
      this.initApolloClient();
      this.initAlertProvider().catch(handleError());
      this.initAutoLoginProvider().catch(handleError());
      this.initBasicAuthProvider().catch(handleError());
      this.initUrlDispatcherProvider().catch(handleError());
      this.initWebContentsOverrideProvider().catch(handleError());
      this.initSDKv2();
      this.initAutoLaunch().catch(handleError());
    } catch (e) {
      handleError()(e as Error);
      ipcRenderer.send('station:app-exit', 1);
    }
  }

  initManifestProvider() {
    this.manifestProvider = new ManifestProvider({
      // Use native fetch for manifests fetching
      distantFetcher: new DistantFetcher(),
//      cachePath: join(app.getPath('userData'), 'ApplicationManifestsCache'),
    });

    (services.manifest as ManifestServiceImpl).init(this.manifestProvider);
  }

  initRouter() {
    this.router = new URLRouter(this.store.getState, this.manifestProvider);
  }

  initResourceRouter() {
    this.resourceRouter = new ResourceRouterDispatcher(this.store, this.router, this.manifestProvider);
  }

  initApolloLink() {
    (services.apolloLink as ApolloLinkServiceImpl).init(
      this.store,
      this.manifestProvider,
      this.resourceRouter,
      this.pubsub,
    );
  }

  initApolloClient() {
    // local apollo client
    // addTypename: false was removed in Apollo Client 3.14+; reactive-graphql workaround
    // is handled via dataIdFromObject returning undefined for non-cacheable shapes.
    this.apolloClient = new ApolloClient({
      link: (services.apolloLink as ApolloLinkServiceImpl).link!,
      cache: new InMemoryCache(),
      // see apollographql/apollo-client#4322
      queryDeduplication: false,
    });

    // Debug: test if reactive-graphql queries resolve locally in the worker
    const testPingQuery = gql`query TestPing { ping }`;
    const testOnlineQuery = gql`query TestOnline { debugOnline { isOnline } }`;
    const testQuery = gql`query TestQuery { stationStatus { isOnline } }`;
    setTimeout(() => {
      this.apolloClient.query({ query: testPingQuery, fetchPolicy: 'network-only' })
        .then(result => console.log('[worker-debug] ping resolved:', JSON.stringify(result.data)))
        .catch(err => console.error('[worker-debug] ping failed:', err.message));
      this.apolloClient.query({ query: testOnlineQuery, fetchPolicy: 'network-only' })
        .then(result => console.log('[worker-debug] debugOnline resolved:', JSON.stringify(result.data)))
        .catch(err => console.error('[worker-debug] debugOnline failed:', err.message));
      this.apolloClient.query({ query: testQuery, fetchPolicy: 'network-only' })
        .then(result => console.log('[worker-debug] stationStatus resolved:', JSON.stringify(result.data)))
        .catch(err => console.error('[worker-debug] stationStatus failed:', err.message));
    }, 3000);
  }

  initAlertProvider() {
    return services.tabWebContents.setAlertDialogProvider(new AlertDialogProviderServiceImpl(this.store));
  }

  initAutoLoginProvider() {
    return services.tabWebContents
      .setAutoLoginDetailsProvider(new TabWebContentsAutoLoginDetailsProviderServiceImpl(this.store));
  }

  initBasicAuthProvider() {
    return services.tabWebContents
      .setBasicAuthDetailsProvider(new BasicAuthDetailsProviderServiceImpl(this.store));
  }

  initUrlDispatcherProvider() {
    return services.tabWebContents
      .setUrlDispatcherProvider(new UrlDispatcherProviderServiceImpl(this.store));
  }

  initWebContentsOverrideProvider() {
    return services.tabWebContents
      .setWebContentsOverrideProvider(new WebContentsOverrideProviderServiceImpl(this.store, this.manifestProvider));
  }

  // this is temporary public
  public handleMenuItemClick({
    event,
    action,
    args,
  }: IMenuServiceObserverOnClickItemParam) {
    switch (action) {
      case 'about':
        AboutWindowManager.show().catch(handleError());
        break;
      case 'settings':
        this.dispatch(ui.toggleVisibility(['settings', 'isVisible']));
        break;
      case 'bang':
        this.mainWindowManager.focus().catch(handleError());
        this.dispatch(bang.toggleVisibility('center-modal', 'topbar_menu_or_keyboard_shortcut'));
        break;
      case 'notification-center':
        this.dispatch(notificationCenter.toggleVisibility());
        break;
      case 'page-reload':
        this.dispatch(executeWebviewMethodForCurrentTab('reload'));
        break;
      case 'page-reset-zoom':
        this.dispatch(resetZoomActiveApp());
        break;
      case 'page-zoom-in':
        this.dispatch(zoomInActiveApp());
        break;
      case 'page-zoom-out':
        this.dispatch(zoomOutActiveApp());
        break;
      case 'page-go-back':
        this.dispatch(executeWebviewMethodForCurrentTab('go-back'));
        break;
      case 'page-go-forward':
        this.dispatch(executeWebviewMethodForCurrentTab('go-forward'));
        break;
      case 'copy-url-to-clipboard':
        this.dispatch(executeWebviewMethodForCurrentTab('copy-url-to-clipboard'));
        break;
      case 'paste-and-match-style':
      case 'paste-and-match-style-hidden':
        this.dispatch(executeWebviewMethodForCurrentTab('paste-and-match-style'));
        break;
      case 'full-screen':
        services.browserWindow.getFocusedWindow()
          .then((w) => {
            if (w) return w.toggleFullscreen();
            return;
          })
          .catch(handleError());
        break;
      case 'app-devtools':
        services.browserWindow.getFocusedWindow()
          .then((w) => {
            if (w) return w.toggleDevTools();
            return;
          })
          .catch(handleError());
        break;
      case 'page-devtools':
        this.dispatch(executeWebviewMethodForCurrentTab('toggle-dev-tools'));
        break;
      case 'worker-devtools':
        services.browserWindow.toggleWorkerDevTools();
        break;
      case 'app-quit':
        services.electronApp.quit().catch(handleError());
        break;
      case 'app-reload':
        services.browserWindow.getFocusedWindow()
          .then((w) => {
            if (w) return w.reload();
            return;
          })
          .catch(handleError());
        break;
      case 'new-page': {
        const [url] = args;
        this.dispatch(dispatchURLNavigationActiveApp(url, { target: NEW_TAB }));
        break;
      }
      case 'find':
        this.dispatch(inTabSearch.activateForCurrentTab());
        break;
      case 'detach-current-tab':
        this.dispatch(detachCurrentlyFocusedApplicationTab());
        break;
      case 'close-current-tab':
        const via = Boolean(event.triggeredByAccelerator) ? 'keyboard-shortcut' : 'click';
        this.dispatch(closeCurrentTab(via));
        break;
      case 'reset-window-position':
        if (this.mainWindowManager.window) {
          this.mainWindowManager.window.resetWindowPosition().catch(handleError());
        }
        break;
      case 'toggle-kbd-shortcuts':
        this.dispatch(toggleKbdShortcuts());
        break;
      case 'show-community':
        this.dispatch(dispatchUrl('https://github.com/getstation/desktop-app/issues'));
        break;
      case 'show-release-notes':
        this.dispatch(setReleaseNotesSubdockVisibility(true));
        break;
      case 'station-features':
        this.dispatch(dispatchUrl('https://getstation.com/features'));
        break;
      case 'reset-current-application':
        this.dispatch(updateUI('confirmResetApplicationModal', 'isVisible', getFocus(this.getState())));
        break;
      case 'open-process-manager':
        this.dispatch(openProcessManager());
        break;
      default:
        throw new Error(`No handled menu action: ${action}`);
    }
  }

  initContextMenu() {
    const handleMenuItemClick = this.handleMenuItemClick.bind(this);
    const { store } = this;

    services.tabWebContents.addGlobalObserver(observer({
      async onNewWebview(webContentsId: number) {
        try {
          const contextMenuService = await services.contextMenu.create({ webcontentsId: webContentsId });

          // @ts-ignore
          contextMenuService.addObserver(observer({
            async onShow(props: Electron.ContextMenuParams) {
              try {
                const newProps = !props.misspelledWord ? props : {
                  ...props,
                  misspellingCorrections: await services.tabWebContents
                    .querySpellchecker(webContentsId, props.misspelledWord),
                };
                const state = store.getState();

                contextMenuService.popup({
                  props: newProps,
                  context: {
                    inWebview: true,
                    backForwardState: {
                      canGoBack: getForeFrontNavigationStateProperty(state, 'canGoBack'),
                      canGoForward: getForeFrontNavigationStateProperty(state, 'canGoForward'),
                    },
                  },
                });
              } catch (err) {
                console.error('[app-worker] contextMenu onShow failed:', err);
              }
            },
            onClickItem(params: IMenuServiceObserverOnClickItemParam) {
              handleMenuItemClick(params);
            },
          }, 'ctx-show-click'));
        } catch (err) {
          console.error('[app-worker] onNewWebview failed:', err);
        }
      },
    }, 'wc-global')).catch(handleError());
  }

  private initStore() {
    this.store = configureStore(this);
    // @ts-ignore debug purpose
    window.stationStore = this.store;
  }

  private initWindowManager() {
    services.browserWindow.setProvider(new BrowserWindowManagerProviderServiceImpl(this.store));
    GenericWindowManager.store = this.store;
    this.mainWindowManager = new MainWindowManager();
    this.mainWindowManager.on('enter-full-screen', () => this.dispatch(setFullScreenState(true)));
    this.mainWindowManager.on('leave-full-screen', () => this.dispatch(setFullScreenState(false)));
    this.mainWindowManager.on('swipe-left', () => this.dispatch(executeWebviewMethodForCurrentTab('go-back')));
    this.mainWindowManager.on('swipe-right', () => this.dispatch(executeWebviewMethodForCurrentTab('go-forward')));
    this.mainWindowManager.on('new-notification', (notificationId: string, props: NotificationProps, options: NotificationOptions) => {
      this.dispatch(notificationCenter.newNotification(undefined, undefined, notificationId, props, options as NewNotificationOptions))
    });
  }

  private initSDK() {
    bxSDK.init(this.store, this.resourceRouter);
  }

  private async initAppLifeCycle() {
    try {
      services.electronApp.setProvider(new ElectronAppServiceProviderServiceImpl(this.store))
      await this.mainWindowManager.create();
    } catch (err) {
      console.error('[app-worker] initAppLifeCycle mainWindow create failed:', err);
    }

    const onActivate = async () => {
      try {
        const isReady = await services.electronApp.isReady();
        if (!isReady) {
          return;
        }
        await this.mainWindowManager.create();
      } catch (err) {
        console.error('[app-worker] onActivate failed:', err);
      }
    };
    services.electronApp.addObserver(observer({ onActivate }, 'app-on-activate')).catch(handleError());
  }

  private initMenu() {
    const { dispatch } = this.store;
    const mainWindowManager = this.mainWindowManager;
    const handleMenuItemClick = this.handleMenuItemClick.bind(this);

    // install the menu
    services.menu.addObserver(observer({
      onClickItem(param: any) {
        // dispatch actions from the menu
        handleMenuItemClick(param);
      },
      onGlobalBangShortcut() {
        if (!mainWindowManager.isCreated()) return;
        dispatch(bang.setVisibility('center-modal', true));
        mainWindowManager.focus();
      },
    }, 'init-menu')).catch(handleError());
  }

  private initOnlineListener() {
    const updateOnlineStatus = (isOnline: boolean) => {
      this.dispatch(setOnlineStatus(isOnline));
    };

    this.onlineHandler = () => updateOnlineStatus(true);
    this.offlineHandler = () => updateOnlineStatus(false);

    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);

    updateOnlineStatus(navigator.onLine);
  }

  private initSDKv2() {
    return (services.sdkv2 as SDKv2ServiceImpl).setStore(this.store);
  }

  private async initAutoLaunch() {
    return services.autolaunch.setAutolaunchProvider(new AutolaunchProviderServiceImpl(this.store));
  }

  private dispatch(action: any) {
    return this.store.dispatch(action);
  }

  private getState() {
    return this.store.getState();
  }
}

if (!isPackaged) {
  process.on('unhandledRejection', error => {
    // eslint-disable-next-line no-console
    console.trace(error);
  });
}

if (module.hot) {
  module.hot.accept();
  module.hot.addDisposeHandler(() => {
    // We ask the main process to restart as if the main process was edited
    ipcRenderer.send('hmr:worker');
  });
}

export default new BrowserXAppWorker();

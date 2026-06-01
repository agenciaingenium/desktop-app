import { compact } from 'ramda-adjunct';
import * as Immutable from 'immutable';
// @ts-ignore: no declaration file
import installDevTools from 'immutable-devtools';
import { applyMiddleware, compose, createStore, Store } from 'redux';
// @ts-ignore: no declaration file
import { observe } from 'redux-observers';
import thunk from 'redux-thunk';
// @ts-ignore: no declaration file
import { client } from 'shared-redux';
import { ElectronIpcRendererDuplex } from '../utils/stream-ipc-proxy';
import observers from '../observers/index.renderer';
import rootReducer from '../reducers';
import { StationState } from '../types';
import { isPackaged } from '../utils/env';
import { namespace } from './const';
import { createActionsBusMiddleware, ActionsEmitter } from './actionsBus';

declare global {
  interface Window {
    station: {
      getGlobal: (name: string) => any;
      ipc: {
        send: (channel: string, ...args: any[]) => void;
        sendSync: (channel: string, ...args: any[]) => any;
        invoke: (channel: string, ...args: any[]) => Promise<any>;
        on: (channel: string, callback: (...args: any[]) => void) => () => void;
        removeListener: (channel: string, callback: (...args: any[]) => void) => void;
      };
      app: {
        getName: () => string;
        getVersion: () => string;
        getPath: (name: string) => string;
        exit: (code?: number) => void;
        quit: () => void;
      };
      shell: {
        openExternal: (url: string) => Promise<void>;
        openPath: (path: string) => Promise<string>;
      };
      window: {
        close: () => void;
        minimize: () => void;
        focus: () => void;
        isFocused: () => Promise<boolean>;
        isFullScreen: () => Promise<boolean>;
        setFullScreen: (flag: boolean) => void;
        toggleFullScreen: () => void;
        getId: () => number;
        getSubData: () => any;
        onFocus: (callback: () => void) => () => void;
        onBlur: (callback: () => void) => () => void;
        onClose: (callback: () => void) => () => void;
      };
      webContents: {
        getCurrentId: () => number;
        openDevTools: () => void;
        fromId: (id: number) => Promise<any>;
      };
      dialog: {
        showMessageBox: (options: any) => Promise<any>;
      };
      browserWindow: {
        getFocusedWindow: () => Promise<any>;
      };
      clipboard: {
        writeText: (text: string) => void;
        readText: () => string;
      };
      webFrame: {
        setVisualZoomLevelLimits: (min: number, max: number) => void;
      };
    };
  }
}

export default async function configureStore(actionsEmitter?: ActionsEmitter): Promise<Store> {
  const workerWebContentsId = window.station.getGlobal('worker').webContentsId;
  // eslint-disable-next-line no-console
  console.log(`[DEBUG] configureStore.client: Creating duplex to worker wcId=${workerWebContentsId}, namespace=${namespace}`);
  const duplex = new ElectronIpcRendererDuplex(workerWebContentsId, namespace);

  const { forwardToServer, getInitialStateClient, replayActionClient } = client(duplex, namespace);

  // Add timeout for initial state to prevent infinite loading
  const timeoutMs = 30000; // 30 seconds
  const initialStatePromise = getInitialStateClient();
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout waiting for initial state after ${timeoutMs}ms. Worker may not be ready.`));
    }, timeoutMs);
  });

  let initialState;
  try {
    initialState = await Promise.race([initialStatePromise, timeoutPromise]);
  } catch (error) {
    console.error('Failed to get initial state:', error);
    // Retry once after a short delay
    // eslint-disable-next-line no-console
    console.log('Retrying initial state fetch...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    initialState = await getInitialStateClient();
  }

  let composeEnhancers = compose;
  if (!isPackaged) {
    // const { composeWithDevTools } = require('remote-redux-devtools'); // eslint-disable-line global-require
    // composeEnhancers = composeWithDevTools({
    //   realtime: true,
    //   trace: true,
    //   name: `renderer webContentsId=${remote.getCurrentWebContents().id}`,
    //   port: 8000,
    // });
    composeEnhancers = compose;
  }

  const middlewares = compact([
    forwardToServer,
    actionsEmitter ? createActionsBusMiddleware(actionsEmitter) : null,
    thunk,
  ]);

  if (process.env.STATION_REDUX_LOGGER) {
    const createLogger = require('redux-logger'); // eslint-disable-line global-require
    const logger = createLogger({
      level: 'info',
      collapsed: true,
      stateTransformer: (state: StationState) => {
        if (Immutable.isCollection(state)) return state.toJS();
        return state;
      },
    });
    middlewares.push(logger);
  }

  // Custom formatter for Immutable log output
  // In Dev Tools, press F1 to load the Settings.
  // Scroll down to the Console section and tick "Enable custom formatters".
  installDevTools(Immutable);

  const enhancer = composeEnhancers(
    applyMiddleware(...middlewares),
  );

  const store = createStore(rootReducer, initialState, enhancer);

  if (!isPackaged && module.hot) {
    module.hot.accept(() =>
      store.replaceReducer(require('../reducers')) // eslint-disable-line global-require
    );
  }

  observe(store, observers, { skipInitialCall: false });

  replayActionClient(store);

  return store;
}

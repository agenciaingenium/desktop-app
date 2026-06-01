import { ipcRenderer } from 'electron';
import log from 'electron-log';
import * as EventEmitter from 'events';
import { applyMiddleware, compose, createStore } from 'redux';
// @ts-ignore: no declaration file
import { observe } from 'redux-observers';
import { createPersistor } from 'redux-persist';
// @ts-ignore: no declaration file
import { autoRehydrate } from 'redux-persist-immutable';
import createSagaMiddleware, { SagaMiddleware } from 'redux-saga';
import thunk from 'redux-thunk';
// @ts-ignore: no declaration file
import { server } from 'shared-redux';
import { Duplex } from 'stream';
import { firstConnectionHandler } from '../utils/stream-ipc-proxy';
import { BrowserXAppWorker } from '../app-worker';
// @ts-ignore no declaration file
import { ready } from '../app/duck';
// @ts-ignore no declaration file
import observers, { delayedObservers } from '../observers';
import rootReducer from '../reducers';
import rootSaga from '../sagas';
import { handleError } from '../services/api/helpers';
import services from '../services/servicesManager';
import { StationStoreWorker } from '../types';
import { isPackaged } from '../utils/env';
import { namespace } from './const';

function asyncInit(store: StationStoreWorker, sagaMiddleware: SagaMiddleware<any>, eventEmitter: EventEmitter, bxApp: any) {
  return Promise.all([
    import('../api/logger').then(b => b.logger),
    import('./storage'),
    import('../persistence/index'),
    import('./duck'),
  ]).catch(err => {
    console.error('[configureStore.worker] asyncInit import failed:', err);
    throw err;
  }).then(([logger, { default: ApiStorage }, { getInitialState }, { REHYDRATION_COMPLETE }]) => {
    const storage = new ApiStorage();
    storage.on('error', (err, metaData) => {
      log.error(err);
      logger.notify(err, metaData);
    });
    const persistor = createPersistor(
      store,
      // @ts-ignore
      storage.getPersistConfig(),
    );
    persistor.pause();

    const sagaPromise = sagaMiddleware.run(rootSaga, bxApp).toPromise();
    const promiseState = getInitialState('local');

    // Wait for saga being ready before notifying that Electron App is ready
    services.electronApp.afterReady().then(() => {
      return sagaPromise.then(() => {
        store.dispatch(ready());
      });
    }).catch(err => {
      console.error('[configureStore.worker] electronApp.afterReady failed:', err);
    });

    store.persistor = persistor;

    // Wait for saga and restored state before dispatching REHYDRATION_COMPLETE and trigerring
    // observers
    return Promise.all([
      sagaPromise,
      promiseState,
    ]).then(([, restoredState]) => restoredState)
      // @ts-ignore
      .then(restoredState => persistor.rehydrate(restoredState.toObject()))
      .then(() => persistor.resume())
      .then(() => store.dispatch({ type: REHYDRATION_COMPLETE }))
      .then(() => eventEmitter.emit('ready'))
      .catch(err => {
        logger.notify(err);
        log.error(err);
        ipcRenderer.invoke('station:dialog-showMessageBox', {
          type: 'error',
          buttons: ['OK'],
          title: 'Station Fatal Error',
          message: 'Station Fatal Error',
          detail: err.message,
        }).then(() => {
          services.electronApp.quit();
        });
      });
  });
}

export function configureStore(bxApp: BrowserXAppWorker) {
  const sagaMiddleware = createSagaMiddleware({
    context: {
      bxApp: bxApp,
    },
  });

  let composeEnhancers = compose;

  if (!isPackaged) {
    // const { composeWithDevTools } = require('remote-redux-devtools');
    // composeEnhancers = composeWithDevTools({
    //   trace: true,
    //   realtime: true,
    //   name: 'main',
    //   port: 8000,
    // });
    composeEnhancers = compose;
  }

  // @ts-ignore: no declaration file
  const eventEmitter = new EventEmitter();
  const readyPromise = new Promise<void>(resolve => eventEmitter.once('ready', resolve));

  // @ts-ignore
  // @ts-ignore
  const { forwardToClients, replayActionServer } = server(
    (cb: (socket: Duplex) => void) => {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Worker: Setting up firstConnectionHandler for bx-redux');
      firstConnectionHandler((socket) => {
        // eslint-disable-next-line no-console
        console.log('[DEBUG] Worker: New bx-redux connection received');
        cb(socket);
      }, namespace);
    },
    namespace,
    {
      readyAfter: readyPromise,
    }
  );

  const enhancer = composeEnhancers(
    autoRehydrate(),
    applyMiddleware(thunk, sagaMiddleware, forwardToClients)
  );

  const store: StationStoreWorker = createStore(rootReducer, undefined, enhancer as any);

  if (!isPackaged && module.hot) {
    module.hot.accept(() =>
      store.replaceReducer(require('../reducers')) // eslint-disable-line global-require
    );
  }

  asyncInit(store, sagaMiddleware, eventEmitter, bxApp).catch(handleError());

  store.ready = () => readyPromise;

  store.runSaga = sagaMiddleware.run.bind(sagaMiddleware);

  observe(store, observers);
  services.electronApp.afterReady().then(() => {
    observe(store, delayedObservers);
  }).catch(err => {
    console.error('[configureStore.worker] electronApp.afterReady failed:', err);
  });

  replayActionServer(store);

  return store;
}

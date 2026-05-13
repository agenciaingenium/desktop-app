/* eslint-disable global-require,import/imports-first */
import './utils/stat-cache';
import './dotenv';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ApolloProvider } from 'react-apollo';
import { ApolloProvider as ApolloHooksProvider } from 'react-apollo-hooks';
import './theme/css/app.global.css';
import '../../../node_modules/font-awesome/css/font-awesome.min.css';
import { handleError } from './services/api/helpers';
import configureStore from './store/configureStore.client';
import ConsoleErrorBoundary from './common/containers/ConsoleErrorBoundary';
import { getGQlClient } from './utils/graphql';

import { ActionsBusReactContext, createActionsEmitter, createActionsBus } from './store/actionsBus';
import { BxNotification } from './notification-center/webview-preload';

window.Notification = BxNotification;

// prevent app pinch zooming - use the station bridge
window.station.webFrame.setVisualZoomLevelLimits(1, 1);

if (process.env.STATION_REACT_PERF) {
  try {
    const Perf = require('react-addons-perf'); // eslint-disable-line global-require
    window.Perf = Perf;
  } catch (error) {
    // Optional legacy dependency; keep startup working even if not installed.
    // eslint-disable-next-line no-console
    console.warn('react-addons-perf is not installed:', error && error.message);
  }
}

const currentWindow = {
  subData: window.station.window.getSubData(),
  id: window.station.window.getId(),
};

const client = getGQlClient();
const actionsEmitter = createActionsEmitter();
const actionsBus = createActionsBus(actionsEmitter);

configureStore(actionsEmitter)
  .then(store => {
    // for debug purpose, gives us a way to easily access the store
    window.stationStore = store;

    render(store);
  })
  .catch(handleError());

const render = (store) => {
  const AppSub = require('./containers/AppSub').default; // eslint-disable-line global-require

  ReactDOM.render(
    <Provider store={store}>
      <ConsoleErrorBoundary>
        <ActionsBusReactContext.Provider value={{ actionsBus }}>
          <ApolloProvider client={client}>
            <ApolloHooksProvider client={client}>
              <AppSub subData={currentWindow.subData} />
            </ApolloHooksProvider>
          </ApolloProvider>
        </ActionsBusReactContext.Provider>
      </ConsoleErrorBoundary>
    </Provider>,
    document.getElementById('root')
  );

  window.station.ipc.send('bx-ready-to-show');
};

if (module.hot) {
  module.hot.accept();
}
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import '../utils/stat-cache';
import '../dotenv';
import '../theme/css/app.global.css';
import '../../../../node_modules/font-awesome/css/font-awesome.min.css';
import configureStore from '../store/configureStore.client';
import ReduxBasedGradientProvider from '../theme/ReduxBasedGradientProvider';
import { handleError } from '../services/api/helpers';
import ConsoleErrorBoundary from '../common/containers/ConsoleErrorBoundary';

configureStore().then(store => {
  // for debug purpose, gives us a way to easily access the store
  window.stationStore = store;

  render(store);
}).catch(handleError());

const unsubscribeBlur = window.station.window.onBlur(() => {
  window.station.window.close();
});
document.addEventListener('keydown', event => {
  switch (event.key) {
    case 'Escape':
      window.station.window.close();
      break;
  }
});

const render = (store) => {
  const AboutWindowContainer = require('./Container').default; // eslint-disable-line global-require
  ReactDOM.render(
    <Provider store={store}>
      <ConsoleErrorBoundary>
        <ReduxBasedGradientProvider>
          <AboutWindowContainer />
        </ReduxBasedGradientProvider>
      </ConsoleErrorBoundary>
    </Provider>
    , document.getElementById('root')
  );

  window.station.ipc.send('bx-ready-to-show');
};

if (module.hot) { 
  module.hot.accept(); 
}

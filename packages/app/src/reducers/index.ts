import { Map } from 'immutable';
import { reducer as reduxUI } from '../ui/redux-ui-compat';

/**
 * Replacement for `redux-immutable`'s combineReducers.
 * Works with Immutable.js Map state: each key's reducer operates on its
 * slice via `state.get(key)` and updates via `state.set(key, result)`.
 */
function combineReducersImmutable(reducers: Record<string, (state: any, action: any) => any>) {
  const reducerKeys = Object.keys(reducers);

  return (state: Map<string, any> | undefined, action: any): Map<string, any> => {
    if (state === undefined) {
      state = Map();
    }

    let nextState = state;
    let hasChanged = false;

    for (const key of reducerKeys) {
      const previousStateForKey = state.get(key);
      const nextStateForKey = reducers[key](previousStateForKey, action);

      if (nextStateForKey !== previousStateForKey) {
        hasChanged = true;
        nextState = nextState.set(key, nextStateForKey);
      }
    }

    // On init (or when a new key appears), ensure every slice is initialized
    if (!hasChanged && state.count() !== reducerKeys.length) {
      for (const key of reducerKeys) {
        if (!state.has(key)) {
          const nextStateForKey = reducers[key](undefined, action);
          nextState = nextState.set(key, nextStateForKey);
          hasChanged = true;
        }
      }
    }

    return hasChanged ? nextState : state;
  };
}
import app from '../app/duck';
import applicationSettings from '../application-settings/duck';
import applications from '../applications/duck';
import auto_update from '../auto-update/duck';
import bang from '../bang/duck';
import chromeExtensions from '../chrome-extensions/duck';
import dialogs from '../dialogs/duck';
import dlToaster from '../dl-toaster/duck';
import dock from '../dock/duck';
import downloads from '../downloads/duck';
import favorites from '../favorites/duck';
import history from '../history/duck';
import inTabSearch from '../in-tab-search/duck';
import nav from '../nav/duck';
import notificationCenter from '../notification-center/duck';
import notifications from '../notifications/duck';
import onboarding from '../onboarding/duck';
import {
  passwordManagerLinksReducer as passwordManagerLinks,
  passwordManagersReducers as passwordManagers,
} from '../password-managers/duck';
import plugins, { serviceDataReducer } from '../plugins/duck';
import subdock from '../subdock/duck';
import subwindows from '../subwindows/duck';
import tabWebcontents from '../tab-webcontents/duck';
import tabs from '../tabs/duck';
import orderedTabs from '../ordered-tabs/duck';
import orderedFavorites from '../ordered-favorites/duck';
import theme from '../theme/duck';
import ui from '../ui/duck';
import userActivities from '../user-activities/duck';
import userIdentities from '../user-identities/duck';
import windows from '../windows/duck';
import { combineAll } from './api';

const rootReducer = combineReducersImmutable({
  app,
  applications,
  tabs,
  orderedTabs,
  orderedFavorites,
  nav,
  dock,
  downloads,
  dialogs,
  dlToaster,
  auto_update,
  onboarding,
  userIdentities,
  favorites,
  bang,
  history,
  notifications,
  notificationCenter,
  tabWebcontents,
  inTabSearch,
  subdock,
  subwindows,
  windows,
  theme,
  userActivities,
  ui: combineAll([reduxUI, ui]),
  passwordManagers,
  passwordManagerLinks,
  servicesData: serviceDataReducer,
  applicationSettings,
  plugins,
  chromeExtensions,
});

export default rootReducer;

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
// @ts-ignore no declaration file
import app from '../app/duck';
// @ts-ignore no declaration file
import applicationSettings from '../application-settings/duck';
// @ts-ignore no declaration file
import applications from '../applications/duck';
// @ts-ignore no declaration file
import auto_update from '../auto-update/duck';
// @ts-ignore no declaration file
import bang from '../bang/duck';
// @ts-ignore no declaration file
import chromeExtensions from '../chrome-extensions/duck';
// @ts-ignore no declaration file
import dialogs from '../dialogs/duck';
// @ts-ignore no declaration file
import dlToaster from '../dl-toaster/duck';
// @ts-ignore no declaration file
import dock from '../dock/duck';
// @ts-ignore no declaration file
import downloads from '../downloads/duck';
// @ts-ignore no declaration file
import favorites from '../favorites/duck';
// @ts-ignore no declaration file
import history from '../history/duck';
// @ts-ignore no declaration file
import inTabSearch from '../in-tab-search/duck';
// @ts-ignore no declaration file
import nav from '../nav/duck';
// @ts-ignore no declaration file
import notificationCenter from '../notification-center/duck';
// @ts-ignore no declaration file
import notifications from '../notifications/duck';
// @ts-ignore no declaration file
import onboarding from '../onboarding/duck';
import {
  passwordManagerLinksReducer as passwordManagerLinks,
  passwordManagersReducers as passwordManagers,
// @ts-ignore no declaration file
} from '../password-managers/duck';
// @ts-ignore no declaration file
import plugins, { serviceDataReducer } from '../plugins/duck';
// @ts-ignore no declaration file
import subdock from '../subdock/duck';
// @ts-ignore no declaration file
import subwindows from '../subwindows/duck';
// @ts-ignore no declaration file
import tabWebcontents from '../tab-webcontents/duck';
// @ts-ignore no declaration file
import tabs from '../tabs/duck';
// @ts-ignore no declaration file
import orderedTabs from '../ordered-tabs/duck';
// @ts-ignore no declaration file
import orderedFavorites from '../ordered-favorites/duck';
// @ts-ignore no declaration file
import theme from '../theme/duck';
// @ts-ignore no declaration file
import ui from '../ui/duck';
// @ts-ignore no declaration file
import userActivities from '../user-activities/duck';
// @ts-ignore no declaration file
import userIdentities from '../user-identities/duck';
// @ts-ignore no declaration file
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

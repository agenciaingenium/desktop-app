import log from 'electron-log';
import { SagaIterator } from 'redux-saga';
import { all, call, getContext, put, select } from 'redux-saga/effects';
import { nanoid } from 'nanoid';
// @ts-ignore
import { MAIN_APP_READY } from '../../app/duck';
// @ts-ignore no declaration file
import { getWindowCurrentTabId } from '../../windows/get';
// @ts-ignore no declaration file
import { getWindows } from '../../windows/selectors';
// @ts-ignore
import { tabWebcontentsToKill } from '../api';
// @ts-ignore
import { removeWebcontents } from '../duck';
// @ts-ignore
import { getTabWebcontents } from '../selectors';
// @ts-ignore
import { getApplicationsSettings } from '../../application-settings/selectors';
// @ts-ignore no declaration file
import { getAllManifests } from '../../applications/api';
// @ts-ignore
import { getTabs } from '../../tabs/selectors';
// @ts-ignore
import { BxAppManifest } from '../../applications/manifest-provider/bxAppManifest';
// @ts-ignore
import { updateLastPutToSleepAt } from '../../tabs/duck';
// @ts-ignore no declaration file
import { newNotification, showNotification, setSleepNotification } from '../../notifications/duck';
// @ts-ignore
import { takeEveryWitness, takeLatestWitness } from '../../utils/sagas';
// @ts-ignore
import { periodicTick, STATION_CHECK_INACTIVE_TAB_EVERY_MS } from '../../utils/sagas';

function* checkSleepyTabs(): SagaIterator {
  log.debug('Checking sleepy tabs');
  const bxApp: any = yield getContext('bxApp');

  const tabWebcontents = yield select(getTabWebcontents as any);
  const appSettings = yield select(getApplicationsSettings as any);
  const tabs = yield select(getTabs as any);
  const windows = yield select(getWindows as any);
  const currentlyVisibleTabIds = windows.map(getWindowCurrentTabId).valueSeq().toArray();
  const applications = yield select((state: any) => state.get('applications'));

  // @ts-ignore
  const manifestURLs: string[] = yield select(getInstalledManifestURLs as any);
  // @ts-ignore
  const manifests: Map<string, BxAppManifest> = yield call(getAllManifests as any, bxApp, manifestURLs);

  // @ts-ignore
  const mountedTabsToKill = tabWebcontentsToKill(applications, appSettings, tabWebcontents, manifests, tabs, currentlyVisibleTabIds);

  // @ts-ignore Fixed with Immutable 4 https://github.com/facebook/immutable-js/issues/1183
  for (const [tabId] of mountedTabsToKill.valueSeq()) {
    log.debug('Putting to sleep', tabId);
    // @ts-ignore
    yield put(updateLastPutToSleepAt(tabId, Date.now()));
    // @ts-ignore
    yield put(removeWebcontents(tabId));
  }

  // @ts-ignore
  const sleepNotif = yield select(getSleepNotification as any);

  if (!sleepNotif && mountedTabsToKill.size > 0) {
    const notificationId = `notif/${nanoid()}`;
    const wording = mountedTabsToKill.size > 1 ? `${mountedTabsToKill.size} unused apps` : `an unused app`;
    const props = {
      title: 'Station',
      body: `We have put in sleep ${wording} so that your battery is safe, but they'll be available next time you use them.
             We'll keep saving your battery in the future without disturbing you`,
      // @ts-ignore
      icon: getIconPath(),
    };
    const options = {
      full: true,
    };
    // @ts-ignore
    yield put(newNotification(undefined, undefined, notificationId, props, options));
    // @ts-ignore
    yield put(showNotification(notificationId));
    // @ts-ignore
    yield put(setSleepNotification(Date.now()));
  }
}

// @ts-ignore
function getSleepNotification(state: any): any {
  return state.get('sleepNotification');
}

// @ts-ignore
function getInstalledManifestURLs(state: any): string[] {
  return state.getIn(['applications', 'installedManifestURLs'])?.toArray() || [];
}

export default function* main() {
  yield all([
    takeLatestWitness(MAIN_APP_READY, function* () {
      // @ts-ignore
      const tickChannel = yield call(periodicTick, STATION_CHECK_INACTIVE_TAB_EVERY_MS);
      yield takeEveryWitness(tickChannel, checkSleepyTabs);
    }),
  ]);
}
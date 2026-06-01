import log from 'electron-log';
import { SagaIterator } from 'redux-saga';
import { all, call, fork, put, select } from 'redux-saga/effects';
import { updateUI } from '../ui/redux-ui-compat';
// @ts-ignore no declaration file
import { READY } from '../app/duck';
import services from '../services/servicesManager';
import { dispatchUrlSaga } from '../urlrouter/sagas';
// @ts-ignore no declaration file
import { consumeLockFileIfExists, createLockFile, FILE } from '../utils/AppData';
// @ts-ignore no declaration file
import { callService, periodicTick, serviceAddObserverChannel, takeEveryWitness } from '../utils/sagas';
// @ts-ignore no declaration file
import {
  CHECK_FOR_UPDATES,
  OPEN_RELEASE_NOTES,
  QUIT_AND_INSTALL,
  SET_UPDATE_IS_AVAILABLE,
  setCheckingForUpdate,
  setDownloadingUpdate,
  setUpdateIsAvailable,
  toggleReleaseNotesSubdockVisibility,
// @ts-ignore no declaration file
} from './duck';
// @ts-ignore no declaration file
import { isDownloadingUpdate, isUpdateAvailable } from './selectors';
import ms from 'ms';

const POLL_UPDATE_INTERVAL = ms('30mins');

function* onQuitAndInstall(): SagaIterator {
  services.electronApp.quit();
}

function* initAppUpdater(): SagaIterator {
  const updateDownloadedChannel = (serviceAddObserverChannel as any)(services.autoUpdater, 'onUpdateDownloaded', 'au-update-downloaded');
  const checkingForUpdateChannel = (serviceAddObserverChannel as any)(services.autoUpdater, 'onCheckingForUpdate', 'au-checking-update');
  const updateNotAvailableChannel = (serviceAddObserverChannel as any)(services.autoUpdater, 'onUpdateNotAvailable', 'au-update-not-available');
  const updateAvailableChannel = (serviceAddObserverChannel as any)(services.autoUpdater, 'onUpdateAvailable', 'au-update-available');
  const errorChannel = (serviceAddObserverChannel as any)(services.autoUpdater, 'onError', 'aus-error');

  const fileExists = yield call(consumeLockFileIfExists, FILE.SHOW_RELEASE_NOTES);

  if (fileExists) {
    yield put(toggleReleaseNotesSubdockVisibility());
    yield put(updateUI('autoUpdate', 'visible', true));
  }

  yield fork(function* () {
    yield all([
      takeEveryWitness(updateDownloadedChannel, function* handle({ releaseName }: { releaseName: string }) {
        yield put(setCheckingForUpdate(false));
        yield put(setDownloadingUpdate(false));
        yield put(setUpdateIsAvailable(releaseName));
      }),
      takeEveryWitness(checkingForUpdateChannel, function* handle() {
        yield put(setCheckingForUpdate(true));
      }),
      takeEveryWitness(updateNotAvailableChannel, function* handle() {
        yield put(setCheckingForUpdate(false));
        yield put(setDownloadingUpdate(false));
      }),
      takeEveryWitness(updateAvailableChannel, function* handle() {
        yield put(setDownloadingUpdate(true));
      }),
      takeEveryWitness(errorChannel, function* handle({ message }: { message: string }) {
        log.error(new Error(message));
        yield put(setCheckingForUpdate(false));
        yield put(setDownloadingUpdate(false));
      }),
    ]);
  });
}

function* checkForUpdates(): SagaIterator {
  const downloading = yield select(isDownloadingUpdate);
  const updateAvailable = yield select(isUpdateAvailable);

  if (downloading || updateAvailable) {
    log.info('[updater] Skipping check');
    return;
  }

  yield callService('autoUpdater', 'checkForUpdates');
}

function* doOpenReleaseNotes(): SagaIterator {
  // @ts-ignore sagas and TS does not seem to go well together
  yield call(dispatchUrlSaga, { url: 'https://github.com/getstation/desktop-app/releases/' });
}

function* consumeUpdateLockFile(): SagaIterator {
  yield call(createLockFile, FILE.SHOW_RELEASE_NOTES);
}

export default function* main(): SagaIterator {
  yield all([
    takeEveryWitness(READY, initAppUpdater),
    takeEveryWitness(QUIT_AND_INSTALL, onQuitAndInstall),
    takeEveryWitness(CHECK_FOR_UPDATES, checkForUpdates),
    takeEveryWitness(OPEN_RELEASE_NOTES, doOpenReleaseNotes),
    takeEveryWitness(SET_UPDATE_IS_AVAILABLE, consumeUpdateLockFile),
  ].concat(process.env.STATION_NO_CHECK_FOR_UPDATE ? [] :
    [takeEveryWitness(periodicTick(POLL_UPDATE_INTERVAL), checkForUpdates)]));
}

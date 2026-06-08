import { SagaIterator } from 'redux-saga';
import { all, call, delay, fork, put, putResolve, select, take } from 'redux-saga/effects';
import { updateUI } from '../../ui/redux-ui-compat';
// @ts-ignore no declaration file
import { setLoadingScreenVisibility, setShowLogin } from '../../app/duck';
import { changeSelectedApp } from '../../applications/duck';
import { getFirstApplicationIdInDock } from '../../dock/selectors';
import { OnboardingType } from '../../ui/types';
import { isDone } from '../selectors';
import { APP_STORE_STEP_FINISHED, markOnboardingAsDone } from '../duck';
import storage from '../../persistence';
import ms from 'ms';

function checkOnboardingDoneInDB(): Promise<boolean> {
  return storage.onboarding.get().then((state: any) => {
    if (!state) return false;
    if (typeof state.get === 'function') return Boolean(state.get('done'));
    return Boolean(state.done);
  }).catch(() => false);
}

function* doOnboardingIfNecessary() {
  const onboardingDone: boolean = yield select(isDone);
  if (onboardingDone) return;

  const dbDone: boolean = yield call(checkOnboardingDoneInDB);
  if (dbDone) {
    yield put(markOnboardingAsDone());
    yield put(setShowLogin(false));
    return;
  }

  yield put(updateUI('onboarding', 'step', 0));
  yield put(updateUI('onboarding', 'onboardingType', OnboardingType.Regular));

  console.log('[onboarding-saga] Waiting for APP_STORE_STEP_FINISHED...');
  yield take(APP_STORE_STEP_FINISHED);
  console.log('[onboarding-saga] APP_STORE_STEP_FINISHED received');

  yield put(markOnboardingAsDone());
  console.log('[onboarding-saga] Onboarding marked as done');
  yield put(setShowLogin(false));

  yield put(setLoadingScreenVisibility(true));

  const applicationId: string = yield select(getFirstApplicationIdInDock);
  console.log('[onboarding-saga] Navigating to first app:', applicationId);
  yield putResolve(changeSelectedApp(applicationId, 'app-installation'));

  yield delay(ms('3sec'));
  yield put(setLoadingScreenVisibility(false));
}

export default function* main(): SagaIterator {
  yield all([
    fork(doOnboardingIfNecessary),
  ]);
}

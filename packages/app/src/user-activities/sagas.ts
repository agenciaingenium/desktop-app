import log from 'electron-log';
import Moment from 'moment';
import ms from 'ms';
import { SagaIterator } from 'redux-saga';
import { put, select, all } from 'redux-saga/effects';
// @ts-ignore no declaration file
import { MAIN_APP_READY } from '../app/duck';
import { getLastInvitationColleagueDate } from '../onboarding/selectors';
import { getUserActivities, isUserSAU as isUserSAUSelector } from '../user-activities/selectors';
import { periodicTick, takeEveryWitness } from '../utils/sagas';
import { addActivity, clearActivityState } from './duck';

function* referralTooltipDisplay() : SagaIterator {
  const userActivities = yield select(getUserActivities as any);
  const lastUse = userActivities.slice(-1)[0];
  // @ts-ignore
  const lastUseWeek = Moment(lastUse).week();

  // @ts-ignore
  if (lastUse && lastUseWeek !== Moment().week()) {
    log.debug('[isUserSAU] Last use not in this week');
    yield put(clearActivityState());
  }

  yield put(addActivity(Date.now()));

  const isUserSAU = yield select(isUserSAUSelector as any);
  if (!isUserSAU) {
    log.debug('[isUserSAU] User is not SAU');
    return;
  }

  // @ts-ignore
  const lastInvitationColleagueDate = yield select(getLastInvitationColleagueDate);
  // @ts-ignore
  const lastInvitationWeek = Moment(lastInvitationColleagueDate).week();

  // @ts-ignore
  if (lastInvitationColleagueDate && lastInvitationWeek === Moment().week()) {
    log.debug('[isUserSAU] User already invited a colleague in this week');
    return;
  }
}

export default function *main(): SagaIterator {
  yield all([
    takeEveryWitness(periodicTick(ms('1day')), referralTooltipDisplay),
    takeEveryWitness(MAIN_APP_READY, referralTooltipDisplay),
  ]);
}

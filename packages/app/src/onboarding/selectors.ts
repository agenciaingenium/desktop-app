import Immutable from 'immutable';
import { createSelector } from 'reselect';
import { StationState } from '../types';

export const isDone = (state: StationState): boolean =>
  // @ts-ignore
  Boolean(state.getIn(['onboarding', 'done'], false));

export const isApplicationStoreTooltipDisabled = (state: StationState): boolean =>
  state.getIn(['onboarding', 'appStoreTooltipDisabled'], false);

export const getSleepNotification = (state: Immutable.Map<string, any>): number | undefined =>
  state.getIn(['onboarding', 'sleepNotification']) as number | undefined;

export const getLastInvitationColleagueDate = (state: Immutable.Map<string, any>): number | undefined =>
  state.getIn(['onboarding', 'lastInvitationColleagueDate']) as number | undefined;

export const isVisible = createSelector(
  isDone,
  // @ts-ignore
  (state: StationState) => state.getIn(['app', 'showLogin'], false) as boolean,
  (onboardingDone, showLogin) => !onboardingDone || showLogin
);

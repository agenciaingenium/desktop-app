import * as Immutable from 'immutable';
import { createSelector } from 'reselect';
import { getNotificationBadge } from '../notifications/get';
import { getNotifications as getNotificationsObjects } from '../notifications/selectors';
import { StationState } from '../types';
import { INFINITE, SYNC_WITH_OS } from './constants';
import ms from 'ms';

export const getSnoozeDuration = (state: StationState): string | undefined =>
  state.getIn(['notificationCenter', 'snoozeDuration']);

export const getSnoozeDurationInMs = (state: StationState): number | string | undefined => {
  const currentSnoozeDuration = getSnoozeDuration(state);

  if (currentSnoozeDuration === SYNC_WITH_OS) return SYNC_WITH_OS;
  if (currentSnoozeDuration === INFINITE) return INFINITE;

  return currentSnoozeDuration ? ms(currentSnoozeDuration) : undefined;
};

export const getSnoozeState = (state: StationState): boolean => {
  const currentSnoozeDurationInMs = getSnoozeDurationInMs(state);
  if (!currentSnoozeDurationInMs) return false;
  // @ts-ignore
  return currentSnoozeDurationInMs > 0 || currentSnoozeDurationInMs === SYNC_WITH_OS || currentSnoozeDurationInMs === INFINITE;
};

export const getSnoozeStartedOn = (state: StationState): number | undefined =>
  state.getIn(['notificationCenter', 'snoozeStartedOn']);

export const isVisible = (state: StationState): boolean =>
  state.getIn(['notificationCenter', 'isVisible'], false);

export const getNotifications = (state: StationState) =>
  state.getIn(['notificationCenter', 'notifications']);

export const getFullNotifications = createSelector(
  getNotifications, getNotificationsObjects,
  (orderedIds, notifications) => {
    return orderedIds
      .map((notificationId: string) => notifications.get(notificationId))
      .filter(notification => Boolean(notification));
  }
);

export const getFullNotificationsOrdered = createSelector(
  getFullNotifications,
  notifications => notifications.reverse()
);

export const getFullNotificationsOrderedGrouped = createSelector(
  getFullNotificationsOrdered,
  (notifications) => {
    let groups: Immutable.List<Immutable.Map<string, any>> = Immutable.List();
    let previousApplicationId: string | undefined = undefined;
    let currentApplicationId: string;
    // @ts-ignore: no proper iterator declaration
    // @ts-ignore
    for (const notification of notifications.values()) {
      currentApplicationId = notification!.get('applicationId', 'station');

      if (currentApplicationId !== previousApplicationId || groups.size === 0) {
        groups = groups.push(Immutable.Map({
          applicationId: currentApplicationId,
          // @ts-ignore
          applicationName: notification!.get('applicationName', 'Station'),
          // @ts-ignore
          icon: notification.get('icon'),
          // @ts-ignore
          label: notification.get('label'),
          notifications: Immutable.List([notification]),
          // @ts-ignore
          badge: getNotificationBadge(notification),
        }));
      } else {
        groups = groups.update(groups.size - 1,
            // @ts-ignore
            m => m.update('notifications',
                // @ts-ignore
                notifs => notifs.push(notification)));
      }

      previousApplicationId = currentApplicationId;
    }
    return groups;
  }
);

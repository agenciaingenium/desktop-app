import Immutable from 'immutable';
import createCachedSelector from 're-reselect';
import { createSelector } from 'reselect';
import { getApplicationId, getApplicationManifestURL } from '../applications/get';
import { INTERNAL_APPLICATIONS } from '../applications/manifest-provider/const';
import { getApplications, getBadgeForApplication } from '../applications/selectors';
import { ApplicationImmutable, StationApplication } from '../applications/types';
import { getOrderedFavoritesForApplicationId } from '../ordered-favorites/selectors';
import { getOrderedTabsForApplicationId } from '../ordered-tabs/selectors';
import { getTabsForApplication } from '../tabs/selectors';
import { StationState } from '../types';
import { getLastActivityAt, getTabIsApplicationHome, getTabFavoriteId } from '../tabs/get';

export const getDock = (state: StationState) => state.get('dock');

export const getTabsAndFavoritesForApplication = createCachedSelector(
  [getOrderedTabsForApplicationId, getOrderedFavoritesForApplicationId, getTabsForApplication],
  (orderedTabs, orderedFavorites, tabs) => {
    const homeTab = tabs.find(tab => tab.get('isApplicationHome'));

    return Immutable.List([homeTab])
      .concat(orderedFavorites)
      .concat(orderedTabs)
      .filter(Boolean);
  }
)(
  /*
   * Re-reselect resolver function.
   * Cache/call a new selector for each different "applicationId"
   */
  (_state, applicationId) => applicationId
);

export const getRecentTabsAndFavoritesForApplication = createCachedSelector(
  getTabsAndFavoritesForApplication,
  (_state: StationState, _applicationId: StationApplication['applicationId'], activityBefore: number) => activityBefore,
  (tabsAndFavorites, activityBefore) => {
    return tabsAndFavorites.filter(
      t => getTabIsApplicationHome(t) || Boolean(getTabFavoriteId(t)) || (getLastActivityAt(t)! > activityBefore)
    );
  }
)(
  (_state, applicationId, activityBefore) =>
    `${applicationId}-${activityBefore}`
);

export const getFirstApplicationIdInDock = (state: StationState) => state.get('dock').first();

export const getApplicationsForDock = createSelector([getDock, getApplications, getBadgeForApplication],
  (dock, applications, badgeForApplication) => {
    const isInternal = (app: ApplicationImmutable | undefined) =>
      !!app && INTERNAL_APPLICATIONS.includes(getApplicationManifestURL(app));

    const dockApplications = dock
      .toOrderedSet()
      .map((appId: string) => applications.get(appId))
      .filter((application: ApplicationImmutable | undefined) => Boolean(application) && !isInternal(application))
      .toList();

    const applicationsToRender = dockApplications.size > 0
      ? dockApplications
      : applications
        .valueSeq()
        .filter((application: ApplicationImmutable) => !isInternal(application))
        .toList();

    return applicationsToRender
      // @ts-ignore
      .map((application: ApplicationImmutable) => {
        const badge = badgeForApplication(getApplicationId(application));
        const extendedAttrs = { badge };
        if (!application) return;
        // @ts-ignore
        return application.merge(Immutable.Map(extendedAttrs));
      })
      .toList();
  }
);

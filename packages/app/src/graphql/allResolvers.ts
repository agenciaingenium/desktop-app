import { mergeResolvers } from '@graphql-tools/merge';
import { Resolvers } from './resolvers-types.generated';

import appResolvers from '../app/resolvers';
import autoUpdateResolvers from '../auto-update/resolvers';
import applicationsResolvers from '../applications/resolvers';
import abstractApplicationsResolvers from '../abstract-application/resolvers';
import activityResolvers from '../activity/resolvers';
import tabWebContentResolvers from '../tab-webcontents/resolvers';
import tabsResolvers from '../tabs/resolvers';
import resourcesResolvers from '../resources/worker/resolvers';
import favoriteResolver from '../favorites/resolvers';
import onboardingResolver from '../onboarding/resolvers';

/**
 * Merge and return all Station resolvers.
 */
export function getAllResolvers(): Resolvers {
  return mergeResolvers([
    appResolvers, autoUpdateResolvers, applicationsResolvers,
    abstractApplicationsResolvers, activityResolvers, tabWebContentResolvers,
    tabsResolvers, resourcesResolvers, favoriteResolver, onboardingResolver,
  ]);
}
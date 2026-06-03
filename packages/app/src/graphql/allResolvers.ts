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
    // Debug: test resolvers to diagnose reactive-graphql
    {
      Query: {
        ping: () => 'pong',
        // Test subscribeStore directly
        debugOnline: (_obj: any, _args: any, context: any) => {
          const { subscribeStore } = require('../utils/observable');
          console.log('[debug-online] resolver called');
          return subscribeStore(context.store, (state: any) => {
            const app = state.get('app');
            console.log('[debug-online] selector called, app type:', typeof app, app?.constructor?.name);
            return app ? app.toJS() : { isOnline: false };
          });
        },
      },
    },
  ]);
}
import Immutable from 'immutable';
import { from, of, Observable, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { oc } from 'ts-optchain';

import { applicationLabel, getChromeExtensionId } from '../abstract-application/helpers';
import { Resolvers } from '../graphql/resolvers-types.generated';
import { getOrderedFavoritesForApplicationId } from '../ordered-favorites/selectors';
import { getOrderedTabsForApplicationId } from '../ordered-tabs/selectors';
import { getLink } from '../password-managers/selectors';
import { getBxResourceForManifestURLAndURL } from '../resources/utils';
import { getTabIsApplicationHome, getTabURL } from '../tabs/get';
import { getTabById, getTabsForApplication } from '../tabs/selectors';
import { getIdentityById } from '../user-identities/selectors';
import { subscribeStore } from '../utils/observable';

import {
  getApplicationActiveTab,
  getApplicationId,
  getApplicationIdentityId,
  getApplicationManifestURL,
  getApplicationSubdomain,
  getInstallContext,
  getApplicationCustomURL,
} from './get';
import { interpretedIconUrl } from './helpers';
import { getApplicationById, getIsApplicationSnoozed } from './selectors';
import { APPLICATION_INSTALLED_TOPIC, ApplicationInstalledPayload } from '../pubsub/topics';
import { compatLegacyManifest } from './manifest-provider/manifest-provider';
import { listAllApplications, manifestToMinimalApplication } from '../../manifests';

const forceShowDescriptionByApps = new Map<string, BehaviorSubject<boolean>>();

const resolvers: Resolvers = {
  Query: {
    listApplications: (_obj) => {
      const manifests = listAllApplications();

      const apps = manifests.map(manifestToMinimalApplication);
      const mostPop = apps.filter(app => app.recommendedPosition > 0)
        .sort((a, b) => a.recommendedPosition - b.recommendedPosition);
      const allOthers = apps.filter(app => app.recommendedPosition <= 0);

      return of([...mostPop, ...allOthers]);
    },
    // @ts-ignore
    getApplicationById: (_obj, args, context) => {
      const { applicationId } = args;
      if (!applicationId) {
        return from([null]);
      }
      return subscribeStore(
        context.store,
        state => getApplicationById(state, applicationId)
      )
        .pipe(
          // Filter out null/undefined — the application may not exist yet in the store
          // (e.g., during startup before the App Store installation saga runs).
          // Using filter instead of throwing preserves the Observable chain so it
          // re-emits once the application appears. Throwing would kill the combineLatest
          // in reactive-graphql, hanging the entire query forever.
          filter(application => application != null),
          distinctUntilChanged(Immutable.is)
        );
    },
    onApplicationInstalled: (_obj, _args, { pubsub }) => {
      return new Observable(subscriber => {

        const maybeSubId = pubsub.subscribe(APPLICATION_INSTALLED_TOPIC, (payload: ApplicationInstalledPayload) => {
          subscriber.next({
            applicationId: payload.applicationId,
            inBackground: payload.inBackground,
          });
        });

        // unsubscription
        return async () => {
          const subId = await maybeSubId;
          pubsub.unsubscribe(subId);
        };
      });
    },
  },

  Application: {
    id: (application) => application.get('applicationId'),
    name: async (application, _, context) => {
      const { manifestProvider, store } = context;

      const { manifest } = await manifestProvider
        .getFirstValue(getApplicationManifestURL(application));

      return applicationLabel(
        store.getState(),
        manifest,
        application);
    },
    appstoreApplicationId: (application) => {
      const installContext = getInstallContext(application);
      if (installContext && installContext.get('platform') === 'appstore') {
        return installContext.get('id');
      }
      return null;
    },
    iconURL: (application) => application.get('iconURL') || null,
    manifestURL: getApplicationManifestURL,
    manifestData: (application, _, context) =>
      context.manifestProvider.get(getApplicationManifestURL(application))
        .pipe(map(bxApp => bxApp.manifest), distinctUntilChanged()),
    isSnoozed: (application, _, context) =>
      subscribeStore(
        context.store,
        state => getIsApplicationSnoozed(state, application.get('applicationId'))
      ).pipe(distinctUntilChanged() as any),
    fullDomain: (application, _, context) => {
      const subdomain = getApplicationSubdomain(application);
      const customURL = getApplicationCustomURL(application);

      if (customURL) {
        return customURL;
      }

      if (subdomain) {
        const { manifestProvider } = context;
        const manifestURL = application.get('manifestURL');
        return manifestProvider.get(manifestURL)
          .pipe(map(bxApp => {
            const domain = oc(bxApp).manifest.bx_multi_instance_config.subdomain_ui_suffix();
            return domain ? `${subdomain}${domain}` : null;
          }), distinctUntilChanged());
      }

      return null;
    },
    passwordManagerLogin: (application, _, context) =>
      subscribeStore(context.store, state => {
        const passwordManagerLink = getLink(state as any, (application as any).applicationId);
        return passwordManagerLink ? passwordManagerLink.get('login') : null;
      }).pipe(distinctUntilChanged() as any),
    identity: (application, _, context) =>
      subscribeStore(context.store, state => {
        const identityId = getApplicationIdentityId(application);
        if (!identityId) return null;
        const identityById = getIdentityById(state as any, identityId);
        if (!identityById) return null;

        return (identityById as any).toJS();
      }).pipe(distinctUntilChanged() as any),
    tabApplicationHome: (application, _, context) =>
      subscribeStore(context.store, state => {
        const applicationId = getApplicationId(application);
        const tabs = getTabsForApplication(state as any, applicationId);
        return (tabs as any).find((tab: any) => getTabIsApplicationHome(tab));
      }).pipe(distinctUntilChanged(), map(tab => {
        if (!tab) {
          return null;
        }
        return (tab as any).toJS();
      })),
    orderedTabsForSubdock: (application, _, context) =>
      subscribeStore(context.store, state => {
        const applicationId = getApplicationId(application);
        return (getOrderedTabsForApplicationId(state as any, applicationId) as any).toJS();
      }).pipe(distinctUntilChanged() as any),
    orderedFavoritesForSubdock: (application, _, context) =>
      subscribeStore(context.store, state => {
        const applicationId = getApplicationId(application);
        return (getOrderedFavoritesForApplicationId(state as any, applicationId) as any).toJS();
      }).pipe(distinctUntilChanged() as any),
    associatedBxResource: async (application, _payload, { store, resourceRouter }) => {
      const state = store.getState();
      const tabId = getApplicationActiveTab(application);
      const manifestURL = getApplicationManifestURL(application);
      const tab = getTabById(state, tabId);
      if (!tab) {
        throw new Error('Unable to find active tab');
      }

      const url = getTabURL(tab)!;

      if (!url || !manifestURL) {
        return undefined;
      }

      return getBxResourceForManifestURLAndURL(resourceRouter, manifestURL, url);
    },
    onboardeeApplicationAssignment: async (application, _payload, _context) => {
      const installContext = getInstallContext(application);
      if (installContext) {
        return installContext.get('onboardeeApplicationAssignmentId');
      }
      return null;
    },
    forceShowDescription: (application) => {
      const applicationId = application.get('applicationId');
      const state$ = forceShowDescriptionByApps.get(applicationId);

      if (state$) {
        return state$.asObservable();
      }

      const defaultState$ = new BehaviorSubject(false);
      forceShowDescriptionByApps.set(applicationId, defaultState$);

      return defaultState$.asObservable();
    },
  },

  ManifestData: {
    interpretedIconURL: (manifest) => {
      const url = interpretedIconUrl(manifest);
      console.log('[icon-debug] interpretedIconURL for', (manifest as any)?.name, ':', url);
      return url;
    },
    bx_keep_always_loaded: (manifest) =>
      manifest.bx_keep_always_loaded || false, // See https://github.com/mesosphere/reactive-graphql/issues/17
    bx_multi_instance_config: (manifest = {}) => {
      const newManifest = compatLegacyManifest(manifest);
      return newManifest.bx_multi_instance_config || {};
    },
    bx_not_use_native_window_open_on_host: manifest => {
      // We expect in future to add a `bx_not_use_native_window_open_on_host` to manifests
      // @ts-ignore since not implemeted yet in manifest, `bxAppManifest.d.ts` does not have it yet
      return manifest.bx_not_use_native_window_open_on_host;
    },
    cxExtensionId: (manifest) => getChromeExtensionId(manifest),
  },

  BxMultiInstanceConfig: {
    instance_wording: (bxMultiInstanceConfig) =>
      bxMultiInstanceConfig.instance_wording || 'instance',
  },

  Mutation: {
    setApplicationForceShowDescription: (_, { applicationId, forceShowDescription }) => {
      const state$ = forceShowDescriptionByApps.get(applicationId);

      if (state$) {
        state$.next(forceShowDescription);
      } else {
        const newState$ = new BehaviorSubject(forceShowDescription);
        forceShowDescriptionByApps.set(applicationId, newState$);
      }

      return forceShowDescription;
    },
  },
};

export default resolvers;

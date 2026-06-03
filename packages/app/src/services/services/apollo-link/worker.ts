import { ApolloLink, execute } from '@apollo/client/link/core';
import { parse } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import ManifestProvider from '../../../applications/manifest-provider/manifest-provider';
import { getLink } from '../../../graphql';
import ResourceRouterDispatcher from '../../../resources/ResourceRouterDispatcher';
import { StationStoreWorker } from '../../../types';
import { ServiceSubscription } from '../../lib/class';
import { RPC } from '../../lib/types';
import { ApolloLinkService, ApolloLinkServiceObserver, SerializedGraphQLRequest } from './interface';

const getGQLRequest = (req: SerializedGraphQLRequest) => ({ ...req, query: parse(req.query) });

export class ApolloLinkServiceImpl extends ApolloLinkService implements RPC.Interface<ApolloLinkService> {
  public link?: ApolloLink;
  private store?: StationStoreWorker;

  init(
    store: StationStoreWorker,
    manifestProvider: ManifestProvider,
    resourceRouter: ResourceRouterDispatcher,
    pubsub: PubSub,
  ) {
    this.store = store;
    this.link = getLink(() => ({ store, manifestProvider, resourceRouter, pubsub }));
  }

  async request(req: SerializedGraphQLRequest, obs: RPC.ObserverNode<ApolloLinkServiceObserver>) {

    if (!obs.onResponse) {
      throw new Error('`onResponse` is mandatory for ApolloLinkServiceObserver');
    }

    if (!obs.onError) {
      throw new Error('`onError` is mandatory for ApolloLinkServiceObserver');
    }

    if (!obs.onComplete) {
      throw new Error('`onComplete` is mandatory for ApolloLinkServiceObserver');
    }

    if (!this.store) {
      throw new Error('redux store is unavailable');
    }

    console.log('[apollo-link-worker] request:', req.operationName);

    const wrappedObs = {
      onResponse: (res: any) => {
        console.log('[apollo-link-worker] onResponse:', req.operationName, JSON.stringify(res?.data)?.slice(0, 100));
        obs.onResponse!(res);
      },
      onError: (err: any) => {
        console.error('[apollo-link-worker] onError:', req.operationName, err?.message);
        obs.onError!(err);
      },
      onComplete: () => {
        console.log('[apollo-link-worker] onComplete:', req.operationName);
        obs.onComplete!();
      },
    };

    return new ServiceSubscription(
      execute(
        this.link!,
        getGQLRequest(req),
      ).subscribe(wrappedObs.onResponse as any, wrappedObs.onError as any, wrappedObs.onComplete as any),
      obs
    );
  }
}

import { InMemoryCache, ApolloClient, ApolloLink, Observable, Operation } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { ExecutionResult, print } from 'graphql';
import { pick } from 'ramda';
import { observer } from '../services/lib/helpers';
import { SerializedExecutionResult, SerializedGraphQLRequest } from '../services/services/apollo-link/interface';
import services from '../services/servicesManager';

/**
 * Apollo link that'll transfer the operations to a ApolloClientProxier via services
 */
export class ServicesLink extends ApolloLink {
  public request(operation: Operation) {
    return new Observable((obs: ZenObservable.SubscriptionObserver<ExecutionResult>) => {
      const req: SerializedGraphQLRequest = {
        operationName: operation.operationName,
        variables: operation.variables,
        query: print(operation.query),
        // There is a lot of data in there, and it can slow down IPC when the are a lot of consecutive calls.
        // So if we want to forward some context, we must whitelist what we need.
        context: pick(['forceFetch'], operation.getContext()),
      };
      const sub = services.apolloLink.request(req, observer({
        onResponse: (res: SerializedExecutionResult) => {
          obs.next(res as ExecutionResult);
        },
        onError: (e: Error) => {
          obs.error(e);
        },
        onComplete: () => {
          obs.complete();
        },
      }, 'apollo-link-request'));
      return () => sub.then(s => s.unsubscribe());
    });
  }
}

// addTypename: false was removed in Apollo Client 3.14+; reactive-graphql
// workaround is in graphql/index.ts which adds __typename to the schema directly.
// ManifestData and other nested objects lack an `id` field, so Apollo cache
// cannot normalize them and throws invariant errors that abort queries.
// keyFields: false tells the cache to store them inline (not normalized).
// This config MUST be applied to every Apollo client that reads from the
// cache (renderer and worker), otherwise writes to the worker cache from
// reactive-graphql queries will throw and abort subscribers.
// @ts-ignore - TypePolicy.keyFields accepts `false` at runtime; the
// upstream types do not include it.
export const typePolicies = {
  ManifestData: { keyFields: false },
  BxMultiInstanceConfig: { keyFields: false },
  StationStatus: { keyFields: false },
  BxResource: { keyFields: false },
  ActivityEntry: { keyFields: false },
};

export function buildCache() {
  // @ts-ignore - same as above
  return new InMemoryCache({ typePolicies });
}

export function getGQlClient() {
  const cache = buildCache();

  const link = ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      // todo: use electron-log and or something else
      if (graphQLErrors) {
        graphQLErrors.map(({ message, locations, path }) =>
          console.error(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
          ),
        );
      }

      if (networkError) console.error('[Network error]', networkError);
    }),
    new ServicesLink(),
  ]);

  return new ApolloClient({
    link,
    cache,
    queryDeduplication: true,
  });
}

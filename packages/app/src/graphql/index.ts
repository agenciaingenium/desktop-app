import { ReactiveSchemaLink } from '@getstation/apollo-link-reactive-schema';
import { ApolloLink } from '@apollo/client/link/core';
import { PubSub } from 'graphql-subscriptions';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { IManifestProvider } from '../applications/manifest-provider/types';
import ResourceRouterDispatcher from '../resources/ResourceRouterDispatcher';
import { StationStoreWorker } from '../types';
import { getAllResolvers } from './allResolvers';

const typeDefs = require('./schema.graphql');

export type StationGQLContext = {
  store: StationStoreWorker,
  manifestProvider: IManifestProvider,
  resourceRouter: ResourceRouterDispatcher,
  pubsub: PubSub,
};

/**
 * Add __typename as a real field on every object type so that
 * reactive-graphql can resolve it (it validates fields against
 * the schema and doesn't support GraphQL meta-fields natively).
 *
 * reactive-graphql passes null for the `info` argument, so each
 * type gets its own field definition with the name captured via closure.
 *
 * Uses duck-typing (getFields) instead of isObjectType() to avoid
 * cross-realm issues when multiple graphql module copies exist.
 */
function addTypenameToSchema(schema: ReturnType<typeof makeExecutableSchema>) {
  for (const [, type] of Object.entries(schema.getTypeMap())) {
    if (typeof (type as any).getFields === 'function' && !type.name.startsWith('__')) {
      const existingFields = (type as any).getFields();
      if (!existingFields['__typename']) {
        const typeName = type.name;
        existingFields['__typename'] = {
          type: (schema as any).getType('String'),
          description: 'The name of the object type.',
          resolve: () => typeName,
        };
      }
    }
  }
  return schema;
}

export const schema = addTypenameToSchema(
  makeExecutableSchema<StationGQLContext>({ typeDefs, resolvers: getAllResolvers() })
);

/**
 * Returns a ApolloLink that will dispatch GQL operations between the local
 * reactive schema and the remote API based on directive `@local`
 */
export const getLink = (contextFn: () => StationGQLContext) => {
  // @ts-ignore
  return ApolloLink.concat(
    // @ts-ignore
    // new DistinctConsecutiveResultsLink(),
    new ReactiveSchemaLink<StationGQLContext>({
      schema,
      context: contextFn,
    })
  );
};

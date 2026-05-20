/**
 * Compatibility layer for generated GraphQL code.
 * Re-exports Apollo Client v3 APIs under the names expected by
 * codegen output that previously imported from `react-apollo'
 * and `react-apollo-hooks'.
 *
 * Generated files import this as `import * as ReactApollo from '...apollo-compat'`
 * and `import * as ReactApolloHooks from '...apollo-compat'` (hooks namespace).
 *
 * Type aliases use `any` because the generated code was designed for
 * react-apollo v2 types. When the codegen plugin is upgraded, these
 * can be made precise.
 */

// Components
export { Query, Mutation, Subscription } from '@apollo/client/react/components';

// HOC utilities
export { withQuery, withMutation, withSubscription, graphql, withApollo } from '@apollo/client/react/hoc';

// Hooks (ReactApolloHooks namespace)
export { useQuery, useMutation, useSubscription, useLazyQuery } from '@apollo/client';

// Type aliases — using `any` for compat with generated code that targets react-apollo v2 types.
// These types are only used inside @ts-nocheck'd generated files.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type QueryProps = any;
export type MutationProps = any;
export type SubscriptionProps = any;
export type OperationOption = any;
export type DataProps = any;
export type MutateProps = any;
export type MutationFn = any;
export type QueryHookOptions = any;
export type MutationHookOptions = any;
export type SubscriptionHookOptions = any;
export type LazyQueryHookOptions = any;
/* eslint-enable @typescript-eslint/no-explicit-any */
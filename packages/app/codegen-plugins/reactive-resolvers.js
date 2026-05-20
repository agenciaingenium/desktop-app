/**
 * Local graphql-codegen plugin for reactive resolvers.
 *
 * Generates resolver type definitions where ResolverFn returns
 * Observable<TResult> | Promise<TResult> | TResult instead of just
 * Promise<TResult> | TResult. This supports @getstation/reactive-graphql
 * which uses RxJS observables.
 *
 * Replaces the external `graphql-codegen-typescript-reactive-resolvers` v2.0.0
 * which depended on old @graphql-codegen/plugin-helpers v1.
 */

const { parse, printSchema, visit, isScalarType } = require('graphql');

function plugin(schema, documents, config) {
  const showUnusedMappers = typeof config.showUnusedMappers === 'boolean' ? config.showUnusedMappers : true;
  const noSchemaStitching = typeof config.noSchemaStitching === 'boolean' ? config.noSchemaStitching : false;

  const imports = ['GraphQLResolveInfo'];
  const hasScalars = Object.values(schema.getTypeMap())
    .filter(t => t.astNode)
    .some(isScalarType);

  if (hasScalars) {
    imports.push('GraphQLScalarType', 'GraphQLScalarTypeConfig');
  }

  const indexSignature = config.useIndexSignature
    ? ['export type WithIndex<TObject> = TObject & Record<string, any>;', 'export type ResolversObject<TObject> = WithIndex<TObject>;'].join('\n')
    : '';

  const stitchingResolverType = `
export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
`;

  const resolverType = `export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =`;
  const resolverFnUsage = `ResolverFn<TResult, TParent, TContext, TArgs>`;
  const stitchingResolverUsage = `StitchingResolver<TResult, TParent, TContext, TArgs>`;

  let resolverDefs;
  if (noSchemaStitching) {
    resolverDefs = `${resolverType} ${resolverFnUsage};`;
  } else {
    resolverDefs = [
      stitchingResolverType,
      resolverType,
      `  | ${resolverFnUsage}`,
      `  | ${stitchingResolverUsage};`,
    ].join('\n');
  }

  const header = `
import { ${imports.join(', ')} } from 'graphql';
import { Observable } from 'rxjs';

${indexSignature}

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) =>  Observable<TResult> | Promise<TResult> | TResult;

${resolverDefs}

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, TParent, TContext, TArgs>;
}

export type SubscriptionResolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionResolverObject<TResult, TParent, TContext, TArgs>)
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;
`;

  // Generate type definitions for each type in the schema
  const typeMap = schema.getTypeMap();
  const typeDefinitions = [];
  const enumDefinitions = [];
  const mapperImports = [];
  const mapperTypes = {};
  const unusedMappers = [];

  // Process mappers config
  if (config.mappers) {
    for (const [typeName, mapperPath] of Object.entries(config.mappers)) {
      mapperTypes[typeName] = mapperPath;
    }
  }

  // Process each type
  const typeNames = Object.keys(typeMap).sort();
  for (const typeName of typeNames) {
    const type = typeMap[typeName];
    if (typeName.startsWith('__')) continue;

    // Scalars
    if (isScalarType(type) && type.astNode) {
      // Custom scalar definition
    }

    // Object types, interfaces, unions
    if (type.astNode) {
      const fields = type.getFields ? type.getFields() : {};
      const parentType = mapperTypes[typeName]
        ? typeName + 'Parent'
        : '{}';

      if (mapperTypes[typeName]) {
        typeDefinitions.push(`export type ${typeName}Parent = ${mapperTypes[typeName]};`);
      }

      // Generate resolvers interface
      const fieldResolvers = [];
      for (const [fieldName, field] of Object.entries(fields)) {
        const fieldType = field.type.toString().replace(/[!\[\]]/g, '');
        fieldResolvers.push(`  ${fieldName}?: Resolver<${fieldType}, ParentType, ContextType>;`);
      }

      if (fieldResolvers.length > 0) {
        const parentTypeDef = mapperTypes[typeName]
          ? `${typeName}Parent`
          : `${typeName}`;
        typeDefinitions.push(`export interface ${typeName}Resolvers<ContextType = any, ParentType = ${parentTypeDef}> {`);
        typeDefinitions.push(...fieldResolvers);
        typeDefinitions.push(`}`);
      }
    }

    // Enums
    if (type.astNode && type.constructor.name === 'GraphQLEnumType') {
      const values = type.getValues().map(v => `  ${v.name} = '${v.name}'`);
      enumDefinitions.push(`export enum ${typeName} {`);
      enumDefinitions.push(...values);
      enumDefinitions.push(`}`);
    }
  }

  // Root resolvers
  const queryType = schema.getQueryType();
  const mutationType = schema.getMutationType();
  const subscriptionType = schema.getSubscriptionType();

  const rootResolvers = [];
  if (queryType) rootResolvers.push(`  Query?: QueryResolvers<ContextType>;`);
  if (mutationType) rootResolvers.push(`  Mutation?: MutationResolvers<ContextType>;`);
  if (subscriptionType) rootResolvers.push(`  Subscription?: SubscriptionResolvers<ContextType>;`);

  // Build mapper imports
  const importLines = [];
  for (const [typeName, mapperPath] of Object.entries(mapperTypes)) {
    const parts = mapperPath.split('#');
    if (parts.length === 2) {
      importLines.push(`import { ${parts[1]} as ${typeName}Parent } from '${parts[0]}';`);
    }
  }

  // Generate Maybe type
  const maybeType = config.maybeValue
    ? `export type Maybe<T> = ${config.maybeValue};`
    : `export type Maybe<T> = T | null;`;

  return [
    ...importLines,
    header,
    maybeType,
    ...enumDefinitions,
    ...typeDefinitions,
    rootResolvers.length > 0
      ? `export interface Resolvers<ContextType = any> {\n${rootResolvers.join('\n')}\n}`
      : '',
  ].filter(Boolean).join('\n');
}

module.exports = { plugin };
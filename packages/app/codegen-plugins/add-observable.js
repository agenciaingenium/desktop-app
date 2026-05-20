/**
 * Post-codegen hook that adds Observable support to the generated resolvers types.
 *
 * The standard @graphql-codegen/typescript-resolvers plugin generates:
 *   export type ResolverTypeWrapper<T> = Promise<T> | T;
 *   export type ResolverFn<...> = (...) => Promise<TResult> | TResult;
 *
 * This script replaces those with Observable-compatible versions:
 *   import { Observable } from 'rxjs';
 *   export type ResolverTypeWrapper<T> = Observable<T> | Promise<T> | T;
 *   export type ResolverFn<...> = (...) => Observable<TResult> | Promise<TResult> | TResult;
 */

const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file || !fs.existsSync(file)) process.exit(0);

const basename = path.basename(file);
// Only modify the resolvers types file
if (basename !== 'resolvers-types.generated.ts') process.exit(0);

let content = fs.readFileSync(file, 'utf8');

// Add Observable import if not present
if (!content.includes("from 'rxjs'")) {
  content = `import { Observable } from 'rxjs';\n${content}`;
}

// Replace ResolverTypeWrapper
content = content.replace(
  /export type ResolverTypeWrapper<T> = Promise<T> \| T;/,
  'export type ResolverTypeWrapper<T> = Observable<T> | Promise<T> | T;'
);

// Replace ResolverFn return type
content = content.replace(
  /\) => Promise<TResult> \| TResult;/,
  ') => Observable<TResult> | Promise<TResult> | TResult;'
);

fs.writeFileSync(file, content);
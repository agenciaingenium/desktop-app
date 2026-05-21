import { endpoints, metadata, namespace } from './const';
import { allServicesRegistry } from './registry';
import { Endpoint, EndpointOptions, ServiceDecoratorOptions } from './types';

const d = require('debug')('service:utils:decorator');

// Simple Map-based metadata storage — replaces Reflect.getOwnMetadata/Reflect.defineMetadata
// to avoid requiring reflect-metadata in the renderer bundle.
const metadataStore = new WeakMap<object, Map<string | symbol, Map<string, any>>>();

function getStore(target: object): Map<string | symbol, Map<string, any>> {
  let store = metadataStore.get(target);
  if (!store) {
    store = new Map();
    metadataStore.set(target, store);
  }
  return store;
}

export const setMetadata = (m: symbol | string, key: string, value: any, aclass: any) => {
  const store = getStore(aclass);
  let md = store.get(m);
  if (!md) {
    md = new Map();
    store.set(m, md);
  }
  md.set(key, value);
};

export const getMetadata = (m: symbol | string, key: string, aclass: any) => {
  const store = metadataStore.get(aclass);
  if (!store) return undefined;
  const md = store.get(m);
  if (!md) return undefined;
  return md.get(key);
};

// Get all metadata for a key, including inherited (replaces Reflect.getMetadata)
export const getAllMetadata = (m: symbol | string, aclass: any): Map<string, any> => {
  const result = new Map<string, any>();
  // Walk prototype chain (like Reflect.getMetadata does)
  let target: any = aclass;
  while (target !== null && target !== undefined) {
    const store = metadataStore.get(target);
    if (store) {
      const md = store.get(m);
      if (md) {
        for (const [key, value] of md) {
          if (!result.has(key)) result.set(key, value);
        }
      }
    }
    target = Object.getPrototypeOf(target);
  }
  return result;
};

// Delete metadata for a key on a target (replaces Reflect.deleteMetadata)
export const deleteMetadata = (m: symbol | string, aclass: any) => {
  const store = metadataStore.get(aclass);
  if (store) {
    store.delete(m);
  }
};

export const bindServiceEndpoints = (aclass: any, options: ServiceDecoratorOptions) => {
  for (const key of Object.getOwnPropertyNames(aclass.prototype)) {
    if (key === 'constructor') continue;
    const attribute: unknown = aclass.prototype[key];
    if (typeof attribute !== 'function') continue;
    const endpointOptions: EndpointOptions = {
      type: options.observer ? 'notification' : 'request',
    };
    endpoint(endpointOptions)(aclass.prototype, key);
  }
};

/**
 * Set the namespace for the Service.
 * ⚠ This is called after methods decorators.
 * @see https://www.typescriptlang.org/docs/handbook/decorators.html#decorator-evaluation
 */
export const service = (n: string, options: ServiceDecoratorOptions = {}) => {
  const defaultOptions = {
    register: true,
    endpointsOnly: true,
    observer: false,
  };
  const mergedOptions = {
    ...defaultOptions,
    ...options,
  };
  return (aclass: any) => {
    d('new service', n, aclass.name);
    aclass[namespace] = n;
    if (mergedOptions.register) {
      allServicesRegistry.add(aclass, `${n}:${aclass.name}`);
    }

    if (mergedOptions.endpointsOnly) {
      bindServiceEndpoints(aclass, mergedOptions);
    }
  };
};

export const endpoint = (options: EndpointOptions = {}) => {
  return (aclass: any, methodName: string) => {
    if (aclass.constructor[namespace] === undefined) {
      throw new Error(`Namespace of ${aclass.constructor.name} must not be undefined`);
    }
    const fullUriGetter = () => `${aclass.constructor[namespace]}:${options.methodIdentifier || methodName}`;
    // Retrieve additional metadata
    const existingMd = getMetadata(metadata, methodName, aclass);
    const infos: Endpoint = {
      getId: fullUriGetter,
      type: options.type || 'request',
      ...existingMd,
    };
    d('new endpoint', aclass.constructor.name, methodName);
    setMetadata(endpoints, methodName, infos, aclass);
  };
};

export const timeout = (ms: number) => {
  return (aclass: any, methodName: string) => {
    d('new timeout', aclass.constructor.name, methodName);
    setMetadata(metadata, methodName, {
      timeout: ms,
    }, aclass);
  };
};
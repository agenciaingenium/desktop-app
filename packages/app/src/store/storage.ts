import Immutable from 'immutable';
import { EventEmitter } from 'events';
import storage from '../persistence';

// Custom reconciler: replace the entire substate with the inbound
// value, never merge. The default redux-persist-immutable reconciler
// does `mergeIn([key], inboundValue)` which, when the slice is a
// List, *appends* the inbound list to the existing one (instead of
// replacing it), so rehydrated values are silently duplicated.
export const replaceAllReconciler = (
  state: Immutable.Map<string, any>,
  inboundState: any,
  reducedState: Immutable.Map<string, any>,
  _log: any,
) => {
  const newState = reducedState ? reducedState : Immutable.Map();
  if (!inboundState) return newState;
  Object.keys(inboundState).forEach((key) => {
    if (!state.has(key)) return;
    if (state.get(key) !== reducedState.get(key)) return;
    newState.set(key, inboundState[key]);
  });
  return newState;
};

export default class ApiStorage extends EventEmitter {

  public api: any;

  constructor(api: any = storage) {
    super();
    this.api = api;
  }

  async getAllKeys(cb: Function) {
    const keys = Object.keys(this.api);
    if (cb) cb(null, keys);
    return keys;
  }

  async getItem(key: string, cb: Function) {
    if (key in this.api) {
      const result = await this.api[key].get();
      if (cb) cb(null, result);
      return result;
    }
    return null;
  }

  async setItem(key: string, obj: any, cb: Function) {
    if (key in this.api) {
      return this.api[key].set(obj).then(() => {
        if (cb) cb(null);
        return;
      }).catch((err: Error) => {
        this.emit('error', err, {
          custom: {
            category: 'storage',
          },
        });
      });
    }
    return;
  }

  async removeItem(key: string, cb: Function) {
    return this.setItem(key, null, cb);
  }

  getPersistConfig() {
    return {
      serialize: false,
      keyPrefix: '',
      _stateInit: Immutable.Map(),
      _stateIterator: (collection: any[], callback: Function) => {
        return collection.forEach((value, key) => callback(value, key));
      },
      _stateGetter: (state: Immutable.Map<string, any>, key: string) => state.get(key),
      _stateSetter: (state: Immutable.Map<string, any>, key: string, value: any) => state.set(key, value),
      // Use the custom reconciler that always replaces (not merges)
      // the inbound substate, so Lists don't get duplicated by
      // mergeIn's append semantics.
      stateReconciler: replaceAllReconciler,
      storage: this,
    };
  }
}

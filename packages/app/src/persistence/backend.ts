import BluebirdPromise from 'bluebird';
import Immutable from 'immutable';
import Sequelize from 'sequelize';
import { KeyValueProxy, ListProxy, MapProxy, SingletonProxy } from './mixins'; // We need this for cancellable Promises

// @ts-ignore
BluebirdPromise.config({
  longStackTraces: true,
  cancellation: true,
});

export const DELAY = process.env.NODE_ENV === 'test' ? 0 : 1000;

const addErrorDetails = (err: Error, message: string) => {
  // eslint-disable-next-line no-param-reassign
  err.message = `${message}.
Details: ${err.message}`;
  return err;
};

export interface StateProxy<T> {
  get(): Promise<T>
  set(state: T): Promise<void>
  actualSet?(state: T): Promise<void>
}

abstract class AbstractStateProxy<T> {
  protected delayed: BluebirdPromise<any>[] = [];

  async set(state: T, delay: number = DELAY) {
    this.cancelDelayed();
    // @ts-ignore
    const delayed = BluebirdPromise.delay(delay);
    this.delayed.push(delayed);
    return new Promise((resolve, reject) => {
      delayed
        .then(() => this.actualSet(state))
        .then(() => resolve(undefined))
        .catch(reject)
        .finally(() => {
          const index = this.delayed.indexOf(delayed);
          if (index !== -1) {
            this.delayed.splice(index, 1);
          }
          if (delayed.isCancelled()) {
            resolve(undefined);
          }
        });
    });
  }

  async actualSet(_state: T) {
    throw new Error('actualSet must be overridden');
  }

  protected cancelDelayed() {
    let p: BluebirdPromise<any> | undefined;
    for (let i = 0; i < this.delayed.length; i += 1) {
      p = this.delayed.shift();
      if (p) p.cancel();
    }
  }
}

/**
 * This class is a helper to load/save simple state elements like 'app'
 */
// @ts-ignore
export class SingletonStateProxy<S extends Sequelize.Model<any, any>, T extends SingletonProxy<S> = SingletonProxy<S>>
  extends AbstractStateProxy<Immutable.Map<string, any>> implements StateProxy<Immutable.Map<string, any>> {

  protected aclass: { new(): T };
  protected instance: T | null;

  constructor(aclass: { new(): T }) {
    super();
    this.aclass = aclass;
    this.instance = null;
  }

  clear() {
    this.instance = null;
  }

  async toState(): Promise<Immutable.Map<string, any>> {
    if (!this.instance) return Immutable.Map();
    const state = await this.instance.toState();
    if (!state) return Immutable.Map();
    return state;
  }

  async init() {
    if (!this.instance) {
      // @ts-ignore
      return this.aclass.getOne().then((instance: T) => {
        this.instance = instance;
        return;
      }).catch((err: any) => {
        console.error('[persistence] SingletonStateProxy.init failed:', err);
        throw err;
      });
    }
  }

  async get() {
    if (!this.instance) {
      // @ts-ignore
      return this.aclass.getOne().then((instance: T) => {
        this.instance = instance;
        return this.toState();
      }).catch((err: any) => {
        // On a fresh install the table doesn't exist yet — return an empty
        // state instead of throwing, so the rest of the app can boot.
        if (err && /no such table/i.test(err.message || '')) {
          return Immutable.Map();
        }
        console.error('[persistence] SingletonStateProxy.get failed:', err);
        throw err;
      });
    }
    return this.toState();
  }

  async actualSet(state: Immutable.Map<string, any>) {
    await this.init();
    if (!this.instance) {
      throw new Error('SingletonStateProxy instance not initialized');
    }
    if (this.instance.isEmpty()) {
      if (state.size === 0) return;
      // @ts-ignore
      this.instance = await this.aclass.create(state);
    } else if (state.size === 0) {
      // @ts-ignore
      await this.aclass.truncate();
      this.clear();
    } else {
      this.instance = await this.instance.update(state);
    }
    return;
  }
}

/**
 * This class is a helper to load/save ordered list state elements like 'dock'
 */
// @ts-ignore
export class ListStateProxy<S extends Sequelize.Model<any, any>, T extends ListProxy<S> = ListProxy<S>>
  extends AbstractStateProxy<Immutable.List<any>> implements StateProxy<Immutable.List<any>> {

  protected aclass: { new(): T };
  protected instances: T[] | null;

  constructor(aclass: { new(): T }) {
    super();
    this.aclass = aclass;
    this.instances = null;
  }

  clear() {
    this.instances = null;
  }

  toState(): Promise<Immutable.List<any>> {
    // @ts-ignore
    return this.aclass.toState(this.instances);
  }

  async get() {
    if (!this.instances) {
      // @ts-ignore
      return this.aclass.getAll().then((instances: T[]) => {
        this.instances = instances;
        return this.toState();
      }).catch((err: any) => {
        if (err && /no such table/i.test(err.message || '')) {
          return Immutable.List();
        }
        console.error('[persistence] ListStateProxy.get failed:', err);
        throw err;
      });
    }
    return this.toState();
  }

  async actualSet(state: Immutable.List<any>) {
    if (this.instances) {
      const currentList = await this.get();
      if (state.equals(currentList)) return;
      // @ts-ignore
      await this.aclass.truncate();
    }
    // @ts-ignore
    this.instances = await this.aclass.createAll(state);
    return;
  }
}

/**
 * This class is a helper to load/save map state elements like 'applications'
 */
// @ts-ignore
export class MapStateProxy<S extends Sequelize.Model<any, any>, T extends MapProxy<S> = MapProxy<S>>
  extends AbstractStateProxy<Immutable.Map<string, any>> implements StateProxy<Immutable.Map<string, any>> {

  protected aclass: { new(): T };
  protected instances: Immutable.Map<string, T> | null;

  constructor(aclass: { new(): T }) {
    super();
    this.aclass = aclass;
    this.instances = null;
  }

  clear() {
    this.instances = null;
  }

  async toState(): Promise<Immutable.Map<string, any>> {
    let instances: Immutable.Map<string, any> = Immutable.Map();
    if (this.instances !== null) {
      for (const [key, instance] of this.instances.entries()) {
        if (instance !== undefined) {
          instances = instances.set(key, await instance.toState());
        }
      }
    }
    return instances;
  }

  async get() {
    if (!this.instances) {
      // @ts-ignore
      return this.aclass.getAll().then((instances: T[]) => {
        this.instances = Immutable.Map();
        for (const instance of instances) {
          this.instances = this.instances!.set(instance.getObjectKey(), instance);
        }
        return this.toState();
      }).catch((err: any) => {
        if (err && /no such table/i.test(err.message || '')) {
          return Immutable.Map();
        }
        console.error('[persistence] MapStateProxy.get failed:', err);
        throw err;
      });
    }
    return this.toState();
  }

  async actualSet(state: Immutable.Map<string, any>) {
    const instances = await this.get();
    const instancesKeys = Immutable.Set<string>(instances.keys());
    const stateKeys = Immutable.Set<string>(state.keys());
    const needUpdate = instancesKeys.intersect(stateKeys);
    const needCreation = stateKeys.subtract(instancesKeys);
    const needDeletion = instancesKeys.subtract(stateKeys);
    const errors: Error[] = [];
    let subState: Immutable.Map<string, any>;

    for (const key of needCreation) {
      subState = state.get(key);
      await
        // @ts-ignore
        this.aclass.findOrCreate(subState)
          .then((data: any) => {
            this.instances = this.instances!.set(key, data);
            return this.instances;
          })
          .catch((err: any) => { // eslint-disable-line no-loop-func
            errors.push(addErrorDetails(err, `Insert error: [${this.aclass.name}] ${subState}`));
          });
    }
    for (const key of needUpdate) {
      subState = state.get(key);
      await
        this.instances!.get(key)!.update(subState)
          .then((data: any) => {
            this.instances = this.instances!.set(key, data);
            return this.instances;
          })
          .catch((err: any) => { // eslint-disable-line no-loop-func
            errors.push(addErrorDetails(err, `Update error: [${this.aclass.name}] ${subState}`));
          });
    }
    for (const key of needDeletion) {
      await
        this.instances!.get(key)!.delete()
          .then(() => {
            this.instances = this.instances!.delete(key);
            return this.instances;
          })
          .catch((err: any) => { // eslint-disable-line no-loop-func
            errors.push(addErrorDetails(err, `Delete error: [${this.aclass.name}] ${key}`));
          });
    }
    if (errors.length > 0) {
      throw new Error(errors as any);
    }
    return;
  }
}

/**
 * This class is a helper to load/save key/value map state elements like 'serviceData[...]'
 */
// @ts-ignore
export class KeyValueStateProxy<S extends Sequelize.Model<any, any>, T extends KeyValueProxy<S> = KeyValueProxy<S>>
  extends AbstractStateProxy<Immutable.Map<string, any>> implements StateProxy<Immutable.Map<string, any>> {

  protected aclass: { new(): T };
  protected instances: T[] | null;

  constructor(aclass: { new(): T }) {
    super();
    this.aclass = aclass;
    this.instances = null;
  }

  clear() {
    this.instances = null;
  }

  toState(): Promise<Immutable.Map<string, any>> {
    // @ts-ignore
    return this.aclass.toState(this.instances);
  }

  async get() {
    if (!this.instances) {
      // @ts-ignore
      return this.aclass.getAll().then((instances: T[]) => {
        this.instances = instances;
        return this.toState();
      }).catch((err: any) => {
        if (err && /no such table/i.test(err.message || '')) {
          return Immutable.Map();
        }
        console.error('[persistence] KeyValueStateProxy.get failed:', err);
        throw err;
      });
    }
    return this.toState();
  }

  async actualSet(state: Immutable.Map<string, any>) {
    if (this.instances) {
      const currentList = await this.get();
      if (state.equals(currentList)) return;
      // @ts-ignore
      await this.aclass.truncate();
    }
    // @ts-ignore
    this.instances = await this.aclass.createAll(state);
    return;
  }
}

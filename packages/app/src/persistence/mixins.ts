import AsyncLock from 'async-lock';
import Immutable from 'immutable';
import Sequelize from 'sequelize';

// In order to have better TS support in IDE
// replace Classes that have a lot of static with dedicated classes or functions

// @ts-ignore
const lock = new AsyncLock();

const filterMap = (x: any) => {
  if (x === null) return false;
  return x !== undefined;
};

export type MapObjectToState<T> = (obj: any) => Promise<T>;
export type MapStateToObject<T> = (obj: Immutable.Collection<any, any>) => Promise<T>;

function createInstanceFromClass<T>(cl: new(...args: any[]) => T, ...args: any[]): T {
  return new cl(...args);
}

export class SingletonProxy<T extends Sequelize.Model<any, any>> {

  public modelInstance: T;

  constructor(model: T) {
    this.modelInstance = model;
  }

  static async mapStateToObject(_state: Immutable.Map<string, any>): Promise<any> {
    throw new Error('Unimplement method');
  }

  static mapObjectToState(_obj: any): Promise<Immutable.Map<string, any>> {
    throw new Error('Unimplement method');
  }

  static async create(_state: Immutable.Map<string, any>): Promise<any> {
    throw new Error('Unimplement method');
  }

  static async getOne(): Promise<any> {
    throw new Error('Unimplement method');
  }

  static async truncate() {
    throw new Error('Unimplement method');
  }

  get() {
    return this.modelInstance;
  }

  async update(state: Immutable.Map<string, any>) {
    // @ts-ignore
    const [obj] = await this.constructor.mapStateToObject(state);

    this.modelInstance = await lock.acquire('db', () => this.modelInstance.update(obj));
    return this;
  }

  toJSON() {
    return this.modelInstance.toJSON();
  }

  isEmpty() {
    return !this.modelInstance;
  }

  async toState() {
    if (!this.modelInstance) return null;
    // @ts-ignore
    return this.constructor.mapObjectToState(this.modelInstance);
  }
}

export class MapProxy<T extends Sequelize.Model<any, any>> extends SingletonProxy<T> {

  static async mapObjectToStateOrNull(dbObj: any) {
    if (!dbObj) return null;
    return this.mapObjectToState(dbObj);
  }

  static async getAll(): Promise<any[]> {
    throw new Error('Unimplement method');
  }

  async delete() {
    return this.modelInstance.destroy();
  }

  getObjectKey(): string {
    throw new Error('Unimplement method');
  }
}

export class ListProxy<T extends Sequelize.Model<any, any>> extends SingletonProxy<T> {
  static async getAll(): Promise<any[]> {
    throw new Error('Unimplement method');
  }

  static async mapArrayToState(_obj: any[]) {
    throw new Error('Unimplement method');
  }

  static async toState(instances: ListProxy<any>[]) {
    return this.mapArrayToState(instances.map(elt => elt.modelInstance));
  }
}

export class KeyValueProxy<T extends Sequelize.Model<any, any>> extends SingletonProxy<T> {
  static async getAll(): Promise<any> {
    throw new Error('Unimplement method');
  }

  static async mapObjectToState(_obj: any): Promise<Immutable.Map<string, any>> {
    throw new Error('Unimplement method');
  }

  static async toState(instances: KeyValueProxy<any>[]) {
    if (!instances) return null;
    return this.mapObjectToState(instances.map(elt => elt.modelInstance));
  }
}

export type SingletonProxyMixinParams = {
  model: Sequelize.ModelCtor<Sequelize.Model<any, any>>
  mapStateToObject: MapStateToObject<any>
  mapObjectToState: MapObjectToState<Immutable.Map<string, any>>,
};

export const SingletonProxyMixin = <T extends Sequelize.Model<any, any>>({
  model,
  mapStateToObject,
  mapObjectToState,
}: SingletonProxyMixinParams) => class extends SingletonProxy<T> {
  // @ts-ignore
  static async mapStateToObject(state: Immutable.Map<string, any>) {
    const ret = await mapStateToObject(state);
    if (Array.isArray(ret)) return ret;
    return [ret];
  }

  // @ts-ignore
  static async mapObjectToState(obj: any) {
    return mapObjectToState(obj).then(x => x.filter(filterMap));
  }

  // @ts-ignore
  static async create(state: Immutable.Map<string, any>) {
    const m = await this.mapStateToObject(state);
    const x = await lock.acquire('db', () => model.create(...m));
    return createInstanceFromClass(this, x);
  }

  // @ts-ignore
  static async truncate() {
    return model.truncate();
  }

  // @ts-ignore
  static async getOne(...args: any[]) {
    const result = await model.findOne(...args);
    // @ts-ignore
    return new this(result);
  }
};

export type MapProxyMixinParams = {
  model: Sequelize.ModelCtor<Sequelize.Model<any, any>>
  key: string
  mapStateToObject: MapStateToObject<any>
  mapObjectToState: MapObjectToState<Immutable.Collection<any, any>>,
};

export const MapProxyMixin = <T extends Sequelize.Model<any, any>>({
  model,
  key,
  mapStateToObject,
  mapObjectToState,
}: MapProxyMixinParams) => class extends MapProxy<T> {
  // @ts-ignore
  static async mapStateToObject(state: Immutable.Map<string, any>) {
    const ret = await mapStateToObject(state);
    if (Array.isArray(ret)) return ret;
    return [ret];
  }

  // @ts-ignore
  static async mapObjectToState(obj: any) {
    return mapObjectToState(obj).then(x => x.filter(filterMap));
  }

  // @ts-ignore
  static* mapAll(results: any[]) {
    for (const result of results) {
      yield createInstanceFromClass(this, result);
    }
  }

  // @ts-ignore
  static async create(state: Immutable.Map<string, any>) {
    const m = await this.mapStateToObject(state);
    const x = await lock.acquire('db', () => model.create(...m));
    return createInstanceFromClass(this, x);
  }

  // @ts-ignore
  static async findOrCreate(state: Immutable.Map<string, any>) {
    const [data] = await this.mapStateToObject(state);
    const options = {
      where: { [key]: data[key] },
      defaults: data,
    };
    const [x] = await lock.acquire('db', () => model.findOrCreate(options));
    return createInstanceFromClass(this, x);
  }

  // @ts-ignore
  static async getAll(...args: any[]) {
    return model.findAll(...args).then(this.mapAll.bind(this));
  }

  // @ts-ignore
  getObjectKey() {
    return this.modelInstance.get(key);
  }
};

export type ListProxyMixinParams = {
  model: Sequelize.ModelCtor<Sequelize.Model<any, any>>
  mapStateToArray: MapStateToObject<any[]>
  mapArrayToState: MapObjectToState<Immutable.List<any>>,
  orderBy?: string,
};

export const ListProxyMixin = <T extends Sequelize.Model<any, any>>({
  model,
  mapStateToArray,
  mapArrayToState,
  orderBy,
}: ListProxyMixinParams) => // @ts-ignore
class extends ListProxy<T> {
  // @ts-ignore
  static async mapStateToArray(state: Immutable.Map<string, any>) {
    // @ts-ignore
    return mapStateToArray(state);
  }

  // @ts-ignore
  static async mapArrayToState(obj: any[]) {
    // @ts-ignore
    return mapArrayToState(obj);
  }

  // @ts-ignore
  static mapAll(results: any[]) {
    let i = 0;
    const l = [];
    for (const result of results) {
      l.push(createInstanceFromClass(this, result, i));
      i += 1;
    }
    return l;
  }

  // @ts-ignore
  static async createAll(state: Immutable.Map<string, any>) {
    // @ts-ignore
    const items = await this.mapStateToArray(state);
    // @ts-ignore
    await lock.acquire('db', () => model.bulkCreate(items));
    // @ts-ignore
    return await this.getAll();
  }

  // @ts-ignore
  static truncate() {
    return model.truncate();
  }

  // @ts-ignore
  static async getAll(...args: any[]) {
    const opts = orderBy ? { order: [orderBy] } : undefined;
    // @ts-ignore
    return model.findAll(...args, opts).then(this.mapAll.bind(this));
  }
};

export type KeyValueProxyMixinParams = {
  model: Sequelize.ModelCtor<Sequelize.Model<any, any>>
  key: string,
  mapStateToObject: MapStateToObject<any>
  mapObjectToState: MapObjectToState<Immutable.Map<string, any>>,
};
export type KeyValueProxyMixinLine = {
  key: string,
  value: string,
  [x: string]: string,
};

export const KeyValueProxyMixin = <T extends Sequelize.Model<any, any>>({
  model,
  key,
  mapStateToObject,
  mapObjectToState,
}: KeyValueProxyMixinParams) => class extends KeyValueProxy<T> {

  // @ts-ignore
  static async mapStateToObject(state: Immutable.Map<string, any>): Promise<Record<string, Record<string, string>>> {
    // @ts-ignore
    return await mapStateToObject(state);
  }

  /**
   * The object to feed to sequelize
   */
  // @ts-ignore
  static getObjectToInsert(groupBy: string, k: string, v: string): KeyValueProxyMixinLine {
    return { [key]: groupBy, key: k, value: v };
  }

  // @ts-ignore
  static async mapObjectToState(obj: KeyValueProxyMixinLine[]) {
    // @ts-ignore
    return await mapObjectToState(obj);
  }

  // @ts-ignore
  static async createAll(state: Immutable.Map<string, any>) {
    // @ts-ignore
    const m = await this.mapStateToObject(state);
    // @ts-ignore
    const keyValues = Object.entries(m as Record<string, Record<string, string>>).reduce(
      (previous, [k, v]) => {
        return [...previous, ...Object.entries(v).map(([k2, v2]) =>
          // @ts-ignore
          this.getObjectToInsert(k, k2, v2)
        )];
      },
      [] as any
    );
    // @ts-ignore
    await lock.acquire('db', () => model.bulkCreate(keyValues));
    // @ts-ignore
    return await this.getAll();
  }

  // @ts-ignore
  static truncate() {
    return model.truncate();
  }

  // @ts-ignore
  static mapAll(results: any[]) {
    return results.map(x => createInstanceFromClass(this, x));
  }

  // @ts-ignore
  static async getAll(options: Sequelize.FindOptions<any> = {}) {
    return model
      .findAll(options)
      .then(this.mapAll.bind(this));
  }
};

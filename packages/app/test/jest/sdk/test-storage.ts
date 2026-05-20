import { storage } from '@getstation/sdk';
import { StorageConsumer } from '@getstation/sdk/lib/storage/consumer';
import * as Immutable from 'immutable';
import { createStore } from 'redux';
import { serviceDataReducer } from '../../../src/plugins/duck';
import StorageProvider from '../../../src/sdk/storage/StorageProvider';

function combineReducersImmutable(reducers: Record<string, (state: any, action: any) => any>) {
  const reducerKeys = Object.keys(reducers);
  return (state: Immutable.Map<string, any> | undefined, action: any): Immutable.Map<string, any> => {
    if (state === undefined) state = Immutable.Map();
    let nextState = state;
    let hasChanged = false;
    for (const key of reducerKeys) {
      const previousStateForKey = state.get(key);
      const nextStateForKey = reducers[key](previousStateForKey, action);
      if (nextStateForKey !== previousStateForKey) {
        hasChanged = true;
        nextState = nextState.set(key, nextStateForKey);
      }
    }
    return hasChanged ? nextState : state;
  };
}

let data!: {
  storage: storage.StorageConsumer,
};

const initialStore = Immutable.fromJS({
  servicesData: {},
});

const reducers = combineReducersImmutable({
  servicesData: serviceDataReducer,
});

beforeAll(() => {
  const store = createStore(reducers, initialStore);
  const provider = new StorageProvider(store as any);
  const consumer = new StorageConsumer('1');
  provider.addConsumer(consumer);
  data = {
    storage: consumer,
  };
});

describe('storage', () => {

  test('getItem returns undefined if value does not exists in store', async () => {
    const value = await data.storage.getItem('testKey');
    expect(value).toBeUndefined();
  });

  test('call setItem with simple value and check updated value', async () => {
    const setItemReturn = await data.storage.setItem('testKey', 'pizza');
    expect(setItemReturn).toBeUndefined();

    const value = await data.storage.getItem('testKey');
    expect(value).toEqual('pizza');
  });

  test('call setItem with complex value and check updated value', async () => {
    const setItemReturn = await data.storage.setItem('testKey', {
      randomKey: {
        eat: 'pizza',
      },
    });
    expect(setItemReturn).toBeUndefined();

    const value = await data.storage.getItem('testKey');
    expect(value).toEqual({
      randomKey: {
        eat: 'pizza',
      },
    });
  });
});

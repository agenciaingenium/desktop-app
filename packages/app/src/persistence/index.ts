import * as Immutable from 'immutable';
import { SingletonStateProxy } from './backend';
import getLocalDBBackend from './local.backend';
import { checkSqliteBackend, migrateUmzug } from './migration';

const getLocalBackend = () => {
  const local = getLocalDBBackend();
  return {
    ...local,
  };
};

export const backends = {
  local: getLocalBackend(),
};

async function waitForPromise(backend: SingletonStateProxy<any>) {
  const keys = Object.keys(backend);
  const a = [];
  for (const k of keys) {
    // @ts-ignore
    a.push([k, await backend[k].get()]);
  }
  return a;
}

export const getInitialState = async (backendKey: string) => {
  await checkSqliteBackend();
  await migrateUmzug();
  // @ts-ignore
  const state = await waitForPromise(backends[backendKey as keyof typeof backends]);
  return Immutable.Map(state as any);
};

export default backends.local;

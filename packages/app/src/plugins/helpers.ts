import memoize from 'memoizee';
import { Maybe } from 'graphql/jsutils/Maybe';

import { JAVASCRIPT_INJECTIONS } from '../applications/manifest-provider/const';

export const injectJS = memoize(
  async (legacyServiceId: Maybe<string>): Promise<string | undefined> => {
    if (!legacyServiceId) return;
    // @ts-ignore
    const scriptsFiles: string[] = JAVASCRIPT_INJECTIONS[legacyServiceId as keyof typeof JAVASCRIPT_INJECTIONS];

    if (scriptsFiles) {
      return scriptsFiles.map(
        (script: string) => require(`./injected-js/${script}.js`)
      )
      .map(s => `(function(){\n${s}\n})()`)
      .join(' ');
    }

    return;
  },
  { promise: true }
);

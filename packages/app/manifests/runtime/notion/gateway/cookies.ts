import {
  SDK,
  session,
} from '@getstation/sdk';
import memoize from 'memoizee';

const requiredCookiesForAuthenticatedUser = ['token_v2', 'userId'];

const optsForMemoizedCookies: memoize.Options<any> = {
  maxAge: 10000,
  promise: true,
  preFetch: true,
};

export const isLogged = memoize(
  async (sdk: SDK) =>
    (await cookies(sdk)).map((c: session.Cookie) => c.name)
      .includes(requiredCookiesForAuthenticatedUser[0]),
  optsForMemoizedCookies
);

export const authCookies = memoize(
  async (sdk: SDK) =>
    (await cookies(sdk))
      .filter((c: session.Cookie) => requiredCookiesForAuthenticatedUser.includes(c.name))
      .map((c: session.Cookie) => `${c.name}=${c.value};`)
      .join(' '),
  optsForMemoizedCookies
);

const cookies = memoize(
  async (sdk: SDK): Promise<session.Cookie[]> =>
    await sdk.session.getCookies(),
  optsForMemoizedCookies
);

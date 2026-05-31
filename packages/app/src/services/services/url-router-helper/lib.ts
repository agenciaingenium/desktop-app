import { Cookie, net, session } from 'electron';
import * as moment from 'moment';
import * as tough from 'tough-cookie';

const maxRedirections = 19;
const errorMessageTooManyRedirects = 'too much redirecting';

/**
 * URLs matching those regexp should not be tested for redirection.
 * Use case:
 *  - Some URLs are valid only once:
 *    e.g.: auth0 email verification URLs can only be shown once
 */
const REDIRECT_BLACKLIST = [
  /^https:\/\/\w+.eu.auth0.com\/lo\/verify_email/,
];

const timer = () => {
  const start = new Date();
  return {
    stop: () => {
      const end = new Date();
      return end.getTime() - start.getTime();
    },
  };
};

const cookiesForUrl = async (url: string) => {
  const defaultSession = session.defaultSession;
  if (!defaultSession) {
    return [];
  }
  return defaultSession.cookies.get({ url });
};

const shouldNotTryToRedirect = (url: string) => {
  for (const re of REDIRECT_BLACKLIST) {
    if (re.test(url)) return true;
  }
  return false;
};

/**
 * For a given URL, will recursively follow the redirect responses until the final URL and returns the final URL.
 *
 * Will make sure session's cookies are used to work around [electron/electron#8891](https://github.com/electron/electron/issues/8891).
 * @param url the URL to resolve
 * @param t timer state
 * @param nbExecutedRedirects
 */
export const resolveRedirects = (url: string, t = timer(), nbExecutedRedirects = 1) =>
  new Promise<{ url: string, resolution: number }>((resolve: any, reject: any) => {
    const resolveNow = () => resolve({ url, resolution: t.stop() });

    if (nbExecutedRedirects === maxRedirections) return reject(errorMessageTooManyRedirects);
    if (shouldNotTryToRedirect(url)) return resolveNow();

    const request = net.request({
      url,
      redirect: 'manual',
    });

    cookiesForUrl(url)
      .then(cookies => {
        const cookieString = cookies
          .map(({ name, value, path, expirationDate, domain, secure, httpOnly }: Cookie) => {
            return new tough.Cookie({
              key: name, value,
              expires: moment.unix(Math.trunc(expirationDate!)).utc(false).toDate(),
              path, domain, secure: Boolean(secure), httpOnly: Boolean(httpOnly),
            }).toString();
          })
          .join('; ');

        request.setHeader('Cookie', cookieString);

        request.on('redirect', (_, __, redirectUrl) => {
          if (redirectUrl !== url) {
            request.abort();
            resolve(resolveRedirects(redirectUrl, t, nbExecutedRedirects + 1));
          }
        });

        request.on('error', error => reject(error));
        request.on('response', resolveNow);

        request.end();
      })
      .catch(err => {
        console.error('[url-router-helper] resolveRedirects failed:', err);
        reject(err);
      });
  });

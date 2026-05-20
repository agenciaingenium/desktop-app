import {
  Session,
  systemPreferences,
  OnBeforeSendHeadersListenerDetails,
  BeforeSendResponse,
  OnHeadersReceivedListenerDetails,
  HeadersReceivedResponse,
} from 'electron';
import enhanceWebRequest from 'electron-better-web-request';
import log from 'electron-log';

const enhancedSessions = new WeakSet<Session>();
const grantedMediaOrigins = new Set<string>();

const orderListeners = (listeners: any) => {
  const orderableOrigins = [
    'ecx-cors', // warning(hugo) minify all keys
    'bx-dynamic-user-agent',
    'ecx-api-handler',
  ];

  const orderedListeners = orderableOrigins.reduce(
    (orderedList: any[], origin: string) => {
      const listener = listeners.find(
        (l: any) => l.context.origin && l.context.origin === origin
      );

      if (listener) {
        orderedList.push(listener);

        return orderedList;
      }

      return orderedList;
    },
    []
  );

  const unorderedListeners = listeners.filter(
    (l: any) => !orderableOrigins.includes(l.context.origin)
  );

  return [...unorderedListeners, ...orderedListeners];
};

const webRequestHandler = (listeners: any) => {
  const sortedListeners = orderListeners(listeners);

  const response = sortedListeners.reduce(
    async (accumulator: any, element: any) => {
      if (accumulator.cancel) {
        return accumulator;
      }

      const result = await element.apply();

      return { ...accumulator, ...result };
    },
    { cancel: false }
  );

  return response;
};

const callbackMethods = [
  'onBeforeRequest',
  'onBeforeSendHeaders',
  'onHeadersReceived',
];

/*
These applications are sensitive to the User-Agent header and have to be rechecked in case of changing the default value:
- Google Meet (299.json)
- Google Chat (517.json)
- Google Calendar (18.json)
it's better to remove bx_override_user_agent attribute from manifest before the check to be sure that it's still necessary.
*/
const chromeVersion = process.versions.chrome || '129.0.0.0';
const defaultUserAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;

export const getUserAgentForApp = (url: string, currentUserAgent: string): string => {

  if (url.startsWith('file://') || url.startsWith('http://localhost')) {
    return currentUserAgent;
  }

  return defaultUserAgent;
};

const getHeaderName = (headerName: string, headers?: Record<string, string[]>): string | undefined => {
  if (headers) {
    const lowCaseHeader = headerName.toLowerCase();
    for (const key in headers) {
      if (key.toLowerCase() === lowCaseHeader) {
        return key;
      }
    }
  }
  return undefined;
};

export const getHeader = (headerName: string, headers?: Record<string, string[]>): any => {
  const realHeaderName = getHeaderName(headerName, headers);
  return headers && realHeaderName ? headers[realHeaderName] : undefined;
};

export const setHeader = (headerName: string, headerValue: any, headers?: Record<string, string[]>): Record<string, string[]> | undefined => {
  if (headers) {
    const realHeaderName = getHeaderName(headerName, headers);
    return {
      ...headers,
      [realHeaderName ? realHeaderName : headerName]: headerValue,
    };
  }
  return headers;
};

export const getRefererForApp = (referer: string): string => {
  return referer && referer.startsWith('http://localhost') ? '' : referer;
};

const getOrigin = (url?: string) => {
  if (!url) return undefined;

  try {
    return new URL(url).origin;
  } catch (_e) {
    return undefined;
  }
};

const isMacMediaAccessBlocked = () => {
  if (process.platform !== 'darwin') return false;

  const microphoneStatus = systemPreferences.getMediaAccessStatus('microphone');
  const cameraStatus = systemPreferences.getMediaAccessStatus('camera');

  return [microphoneStatus, cameraStatus].some(status =>
    status === 'denied' || status === 'restricted'
  );
};

const enhancePermissions = (session: Session) => {
  const targetSession = session as any;

  if (typeof targetSession.setPermissionCheckHandler === 'function') {
    targetSession.setPermissionCheckHandler((_webContents: Electron.WebContents, permission: string, requestingOrigin?: string, details?: { requestingUrl?: string }) => {
      if (permission !== 'media') return false;
      if (isMacMediaAccessBlocked()) return false;

      const origin = getOrigin(requestingOrigin) || getOrigin(details && details.requestingUrl);
      return origin ? grantedMediaOrigins.has(origin) : true;
    });
  }

  if (typeof targetSession.setPermissionRequestHandler === 'function') {
    targetSession.setPermissionRequestHandler((webContents: Electron.WebContents, permission: string, callback: (permissionGranted: boolean) => void, details?: { requestingUrl?: string }) => {
      if (permission !== 'media') {
        callback(false);
        return;
      }

      if (isMacMediaAccessBlocked()) {
        log.warn('[session] Media permission denied by macOS privacy settings');
        callback(false);
        return;
      }

      const origin = getOrigin(details && details.requestingUrl) || getOrigin(webContents.getURL());
      if (origin) {
        grantedMediaOrigins.add(origin);
      }

      callback(true);
    });
  }
};

export const enhanceSession = (session: Session) => {
  if (enhancedSessions.has(session)) return;
  enhancedSessions.add(session);

  enhanceWebRequest(session);
  enhancePermissions(session);

  for (const callbackMethod of callbackMethods) {
    // @ts-ignore
    session.webRequest.setResolver(callbackMethod, webRequestHandler);
  }

  session.setUserAgent(defaultUserAgent);

  session.webRequest.onBeforeSendHeaders(
    (details: OnBeforeSendHeadersListenerDetails, callback: (beforeSendResponse: BeforeSendResponse) => void) => {
      details.requestHeaders['User-Agent'] = getUserAgentForApp(details.url, session.getUserAgent());
      details.referrer = getRefererForApp(details.referrer);
      details.requestHeaders['Referer'] = details.referrer;

      callback({
        cancel: false,
        requestHeaders: details.requestHeaders
      });
    }
  );

  session.webRequest.onHeadersReceived(
    (details: OnHeadersReceivedListenerDetails, callback: (headersReceivedResponse: HeadersReceivedResponse) => void) => {
      const responseHeaders = details.responseHeaders;

      if (responseHeaders) {
        delete responseHeaders['content-security-policy'];  //vk: causes "This document requires 'TrustedHTML' assignment." error. Does not allow us to modify page CSS.
        delete responseHeaders['content-security-policy-report-only'];
      }

      callback({
        responseHeaders,
      })
    }
  )
}

/* eslint-disable global-require */

const { contextBridge } = require('electron');
const { parse } = require('url');
const equals = require('is-equal-shallow');
const {
  IPC,
  registerApi,
  exposeAll,
  createSender,
  createListener,
  createSendToHost,
  injectIntoPage,
  ipcRenderer,
} = require('./preload-api');

// ====== Register sub-preload API sections ======

// Dialogs (alert override)
const dialogsApi = require('../../dialogs/webview-preload').api;
registerApi('dialogs', dialogsApi);

// UI (cursor icon)
const uiApi = require('../../ui/webview-preload').api;
registerApi('ui', uiApi);

// Autologin
const autologinApi = require('./autologin').api;
registerApi('autologin', autologinApi);

// BX API (notification center, applications, theme, identities, manifest)
// The plugins/webview-preload uses contextBridge directly with 'bxApi' key.
// We keep it as-is for backward compatibility since webview-inject.js uses window.bxApi.
require('../../plugins/webview-preload');

// ====== Page-level IPC handlers (run in preload context, DOM is shared) ======

const BX_META_SELECTOR = 'meta[name^=browserx-]';

class BxMetasObserver {
  init() {
    this.metasValuesCached = {};
    this.emitMetasCurrentValuesIfChanged(true);
    this.startObserve();
  }

  startObserve() {
    this.headMutationObserver = new MutationObserver(
      this._onMutations.bind(this)
    );
    this.headMutationObserver.observe(document.head, {
      subtree: true,
      childList: true,
      attributes: true
    });
  }

  stopObserve() {
    this.headMutationObserver.disconnect();
  }

  _onMutations(mutations) {
    const attrChanges = mutations
      .filter(e => e.type === 'attributes')
      .filter(e => e.target.matches(BX_META_SELECTOR));
    if (attrChanges.length > 0) return this.emitMetasCurrentValuesIfChanged();

    // badge meta node removed
    const deletions = mutations
      .filter(e => e.type === 'childList')
      .filter(e => e.removedNodes.length > 0)
      // removedNodes is nodelist, convert
      .map(e => Array.from(e.removedNodes).filter(node => !!node.matches))
      .map(removedNodes =>
        removedNodes.find(node => node.matches(BX_META_SELECTOR))
      )
      .filter(removedNode => !!removedNode);
    if (deletions.length > 0) return this.emitMetasCurrentValuesIfChanged();

    const additions = mutations
      .filter(e => e.type === 'childList')
      .filter(e => e.addedNodes.length > 0)
      // addedNodes is nodelist, convert to array
      .map(e => Array.from(e.addedNodes).filter(node => !!node.matches))
      .map(addedNodes =>
        addedNodes.find(node => node.matches(BX_META_SELECTOR))
      )
      .filter(addedNode => !!addedNode);
    if (additions.length > 0) return this.emitMetasCurrentValuesIfChanged();
  }

  emitMetasCurrentValuesIfChanged(forceEmit) {
    const v = this.getCurrentMetasValues();
    const changed = !equals(v, this.metasValuesCached);
    if (changed || forceEmit) {
      ipcRenderer.sendToHost('page-bxmetas-updated', v);
    }
    this.metasValuesCached = v;
  }

  getCurrentMetasValues() {
    const metaEls = document.querySelectorAll(BX_META_SELECTOR);
    if (metaEls.length === 0) return {};

    const metaValues = {};
    Array.from(metaEls).forEach(metaEl => {
      const key = metaEl.name.match(/browserx-(.*)/)[1];
      metaValues[key] = metaEl.content;
    });
    return metaValues;
  }
}

const badgeObserver = new BxMetasObserver();
document.addEventListener(
  'DOMContentLoaded',
  () => {
    badgeObserver.init();

    // track any click so we use it as activity indicator
    document.body.addEventListener(
      'click',
      () => {
        ipcRenderer.sendToHost('page-click');
      },
      true
    );
  },
  false
);

// Redirect handler
ipcRenderer.on('redirect-url', (_event, url) => {
  window.location.assign(url);
});

// ====== Register page-level APIs ======

registerApi('page', {
  print: createSender(IPC.PRINT),
  sendToHost: createSendToHost,
});

// ====== Inject page context overrides ======
// With contextIsolation=true, window properties set in the preload context
// are not visible to the page. We inject a script to set them in the page context.

// Chrome runtime shim for GDrive and other apps
injectIntoPage(`
  // Some apps like Qonto determine if browser is Chrome by checking window.chrome.webstore
  if (typeof window.chrome === 'undefined') {
    window.chrome = {};
  }
  window.chrome = Object.assign({ webstore: true }, window.chrome);

  // GDrive expects window.chrome.runtime
  if (!window.chrome.runtime) {
    window.chrome = Object.assign(
      {
        runtime: {
          connect: function() {
            return {
              onMessage: {
                addListener: function() {},
                removeListener: function() {}
              },
              postMessage: function() {},
              disconnect: function() {}
            };
          },
          sendMessage: function(extensionId, message, options, responseCallback) {
            if (typeof options === 'function') {
              responseCallback = options;
            }
            if (!responseCallback) return;
            if (typeof responseCallback !== 'function')
              throw new Error(
                'Error in invocation of runtime.sendMessage(optional string extensionId, any message, optional object options, optional function responseCallback): No matching signature.'
              );
            callSendMessageCallbackWithError(
              responseCallback,
              'Could not establish connection. Receiving end does not exist.'
            );
          },
          sendNativeMessage: function(application, message, responseCallback) {
            if (!responseCallback) return;
            if (typeof responseCallback !== 'function')
              throw new Error(
                'Error in invocation of runtime.sendNativeMessage(string application, object message, function responseCallback): No matching signature.'
              );
            callSendMessageCallbackWithError(
              responseCallback,
              'Could not establish connection. Receiving end does not exist.'
            );
          }
        }
      },
      window.chrome
    );
  }

  function callSendMessageCallbackWithError(responseCallback, errorMessage) {
    window.chrome.runtime.lastError = { message: errorMessage };
    responseCallback();
    delete window.chrome.runtime.lastError;
  }

  // GDrive offline extension compat
  window._docs_chrome_extension_exists = true;
  window._docs_chrome_extension_features_version = 1;
  window._docs_chrome_extension_permissions = [
    'alarms',
    'clipboardRead',
    'clipboardWrite',
    'storage',
    'unlimitedStorage'
  ];

  // Forward print actions to main process
  window.print = function() {
    window.station.page.print();
  };

  // Prevents Cmd+T from being handled by any app
  document.addEventListener('keydown', function(event) {
    if (event.key === 't' && event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.stopPropagation();
    }
  }, { capture: true });
`);

// ====== Electron chrome extension preload (currently disabled for Electron 31) ======
if (!process.env.STATION_DISABLE_ECX) {
  try {
    /* webpackIgnore: true */
    require('electron-chrome-extension/preload');
  } catch (e) {
    console.warn('[preload] electron-chrome-extension/preload not available, skipping');
  }
}

// ====== Window open override ======
require('./window-open');

// ====== Expose all APIs to the page context via contextBridge ======
exposeAll(contextBridge);

// ====== Post-preload global cleanup ======
// With contextIsolation=true, the preload context is isolated from the page,
// so global cleanup is less critical, but we still do it for safety.
const preload = Object.keys(window);
const { removeDiff } = require('./clean-global');

// Exposed globals after all executed preloads
const postload = Object.keys(window);

// List of allowed exposure on globals
const whitelist = new Set([
  'station',
  'bxApi',
  'chrome',
  '_docs_chrome_extension_exists',
  '_docs_chrome_extension_features_version',
  '_docs_chrome_extension_permissions',
]);

// Remove diff in globals (IF NOT WHITELISTED) to avoid leaks
removeDiff(preload, postload, whitelist, window);

// ====== WebUI preload (station: protocol pages) ======
require('../../webui/preload');
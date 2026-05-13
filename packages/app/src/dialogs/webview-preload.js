const { IPC, createSyncSender, injectIntoPage } = require('../static/preload/preload-api');
const RecursiveOverride = require('../utils/webview-override-helper');

const alertSync = createSyncSender(IPC.WINDOW_ALERT);

// Register API for contextBridge
const api = {
  alert: (message, title) => alertSync({ message, title: title || '' }),
};

function overrideAlerts(windowObject) {
  windowObject.alert = (message, title = '') => {
    alertSync({ message, title });
    return;
  };
}

// Override in preload context (for iframes that share the same context)
RecursiveOverride(document, window, overrideAlerts);

// Inject into page context so the page's window.alert is also overridden
injectIntoPage(`
  window.alert = function(message, title) {
    window.station.dialogs.alert(message, title || '');
    return undefined;
  };
`);

module.exports = { api };
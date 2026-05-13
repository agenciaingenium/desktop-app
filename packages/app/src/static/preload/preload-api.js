/**
 * Centralized preload API for contextBridge migration.
 *
 * Provides helper functions for creating safe IPC wrappers that can be
 * exposed to the renderer via contextBridge.exposeInMainWorld().
 *
 * Each sub-preload should:
 * 1. Use these helpers to create its API object
 * 2. Register its API section via registerApi()
 * 3. The main preload aggregator calls exposeAll() once at the end
 */

const { ipcRenderer } = require('electron');

// ====== IPC Channel Constants ======
const IPC = {
  // Page events (sent to host webview)
  PAGE_BXMETAS_UPDATED: 'page-bxmetas-updated',
  PAGE_CLICK: 'page-click',

  // Dialogs
  WINDOW_ALERT: 'window-alert',

  // UI
  UI_SET_CURSOR_ICON: 'ui-setCursorIcon',

  // Autologin
  AUTOLOGIN_GET_CREDENTIALS: 'autologin-get-credentials',
  AUTOLOGIN_DISPLAY_REMOVE_LINK: 'autologin-display-removeLinkBanner',
  AUTOLOGIN_VALUE_RETRIEVED: 'autologin-value-retrieved',

  // Print
  PRINT: 'print',

  // Redirect
  REDIRECT_URL: 'redirect-url',
};

// ====== API Sections Registry ======
const apiSections = {};

/**
 * Register an API section to be exposed via contextBridge.
 * @param {string} sectionName - The key name (e.g. 'dialogs', 'autologin')
 * @param {object} apiObject - The API object with methods wrapping IPC calls
 */
function registerApi(sectionName, apiObject) {
  if (apiSections[sectionName]) {
    Object.assign(apiSections[sectionName], apiObject);
  } else {
    apiSections[sectionName] = apiObject;
  }
}

/**
 * Expose all registered API sections via contextBridge.
 * Must be called exactly once, after all sub-preloads have registered.
 * @param {string} apiKey - The window property name (default: 'station')
 */
function exposeAll(contextBridge, apiKey = 'station') {
  contextBridge.exposeInMainWorld(apiKey, apiSections);
}

// ====== IPC Helper Functions ======
// These create safe wrapper functions that can be exposed via contextBridge.
// They wrap specific IPC channels to avoid exposing arbitrary IPC access.

/**
 * Create a function that sends a one-way IPC message.
 * @param {string} channel - The IPC channel name
 * @returns {function} A function that sends args to the channel
 */
function createSender(channel) {
  return (...args) => ipcRenderer.send(channel, ...args);
}

/**
 * Create a function that sends a synchronous IPC message and returns the result.
 * @param {string} channel - The IPC channel name
 * @returns {function} A function that sends args synchronously and returns the result
 */
function createSyncSender(channel) {
  return (...args) => ipcRenderer.sendSync(channel, ...args);
}

/**
 * Create a function that invokes an IPC handler and returns a Promise.
 * @param {string} channel - The IPC channel name
 * @returns {function} A function that invokes the channel and returns a Promise
 */
function createInvoker(channel) {
  return (...args) => ipcRenderer.invoke(channel, ...args);
}

/**
 * Create a function that registers a listener for an IPC channel.
 * Returns an unsubscribe function.
 * @param {string} channel - The IPC channel name
 * @returns {function} A function that takes a callback and returns an unsubscribe function
 */
function createListener(channel) {
  return (callback) => {
    const handler = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  };
}

/**
 * Create a function that registers a one-time listener for an IPC channel.
 * @param {string} channel - The IPC channel name
 * @returns {function} A function that takes a callback for a single event
 */
function createOnceListener(channel) {
  return (callback) => {
    ipcRenderer.once(channel, (_event, ...args) => callback(...args));
  };
}

/**
 * Create a function that sends a message to the host webview.
 * @param {string} channel - The IPC channel name
 * @returns {function} A function that sends args to the host
 */
function createSendToHost(channel) {
  return (...args) => ipcRenderer.sendToHost(channel, ...args);
}

/**
 * Inject a script into the page's main world.
 * With contextIsolation=true, the preload runs in an isolated context,
 * so setting window properties directly won't affect the page.
 * Injecting a <script> tag from the preload executes in the page context.
 * @param {string} code - JavaScript code to execute in the page context
 */
function injectIntoPage(code) {
  const script = document.createElement('script');
  script.textContent = code;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

module.exports = {
  IPC,
  registerApi,
  exposeAll,
  createSender,
  createSyncSender,
  createInvoker,
  createListener,
  createOnceListener,
  createSendToHost,
  injectIntoPage,
  ipcRenderer,
};
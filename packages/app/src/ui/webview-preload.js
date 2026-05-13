const { IPC, createListener } = require('../static/preload/preload-api');

const onSetCursorIcon = createListener(IPC.UI_SET_CURSOR_ICON);

// Register API for contextBridge
const api = {
  onSetCursorIcon,
};

// Also set up the direct DOM listener in the preload context
// (DOM APIs are shared across contexts with contextIsolation)
document.addEventListener('DOMContentLoaded', () => {
  onSetCursorIcon((cursor) => {
    document.querySelector('html').style.cursor = cursor;
  });
});

module.exports = { api };
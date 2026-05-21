// In the renderer (target: web), electron APIs aren't available at module load time.
// Webpack DefinePlugin injects process.type and process.env.IS_PACKAGED at compile time.
// In the main process / worker, require('electron') works normally.

let _isPackaged: boolean;

if (process.type === 'renderer') {
  // Renderer: use the value injected by webpack DefinePlugin
  _isPackaged = process.env.IS_PACKAGED === 'true';
} else if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'storybook') {
  _isPackaged = false;
} else {
  try {
    _isPackaged = require('electron').app.isPackaged;
  } catch {
    _isPackaged = false;
  }
}

export const isPackaged = _isPackaged;
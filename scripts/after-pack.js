exports.default = async function(context) {

  const { appOutDir, targets } = context;

  const fs = require('fs-extra');
  const path = require('path');
  const originalDir = process.cwd();

  // Fix uuid@3.x subpath imports for Electron 40+ (Node 18+).
  // uuid 3.x doesn't define "exports" in its package.json, so require('uuid/v4')
  // fails at runtime with "Package subpath './v4' is not defined by exports".
  // We patch the package.json in asar.unpacked (which takes precedence over asar).
  const resourcesDir = path.join(
    appOutDir,
    context.electronPlatformName === 'darwin'
      ? 'Station.app/Contents/Resources'
      : 'resources'
  );
  const unpackedUuidPkg = path.join(resourcesDir, 'app.asar.unpacked', 'node_modules', 'uuid', 'package.json');

  if (fs.existsSync(unpackedUuidPkg)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(unpackedUuidPkg, 'utf8'));
      if (!pkg.exports) {
        pkg.exports = {
          '.': './index.js',
          './v1': './v1.js',
          './v3': './v3.js',
          './v4': './v4.js',
          './v5': './v5.js',
        };
        fs.writeFileSync(unpackedUuidPkg, JSON.stringify(pkg, null, 2) + '\n');
        console.log('[after-pack] Patched uuid/package.json with exports field');
      }
    } catch (e) {
      console.warn('[after-pack] Could not patch uuid/package.json:', e.message);
    }
  }

  const isLinux = targets.find(target => target.name === 'appImage');
  if (!isLinux) {
    return;
  }

  process.chdir(appOutDir);

  fs.moveSync('station-desktop-app', 'station-desktop-app.bin');

  const wrapperScript =
`#!/bin/sh
if [ -z \${WAYLAND_DISPLAY+x} ]; then
  WAYLAND_PARAMS=""
else
  WAYLAND_PARAMS="--enable-features=UseOzonePlatform --ozone-platform=wayland"
fi
nohup "$(dirname "$(readlink -f "$0")")/station-desktop-app.bin" \$WAYLAND_PARAMS --no-sandbox "$@" >/dev/null 2>&1 &
      `;
  fs.writeFileSync('station-desktop-app', wrapperScript);
  fs.chmodSync('station-desktop-app', '755');

  process.chdir(originalDir);
}
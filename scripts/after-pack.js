const fs = require('fs-extra');
const path = require('path');
const { patchUuidPackageJson } = require('./patch-uuid-exports');

exports.default = async function(context) {

  const { appOutDir, targets } = context;

  const resourcesDir = path.join(
    appOutDir,
    context.electronPlatformName === 'darwin'
      ? 'Station.app/Contents/Resources'
      : 'resources'
  );
  const unpackedUuidPkg = path.join(resourcesDir, 'app.asar.unpacked', 'node_modules', 'uuid', 'package.json');
  patchUuidPackageJson(unpackedUuidPkg);

  // Auto-copy to /Applications for faster testing
  if (context.electronPlatformName === 'darwin') {
    const appSrc = path.join(appOutDir, 'Station.app');
    const appDest = '/Applications/Station.app';
    console.log(`[after-pack] Copying ${appSrc} -> ${appDest}`);
    fs.removeSync(appDest);
    fs.copySync(appSrc, appDest);
    console.log('[after-pack] Done');
  }

  const isLinux = targets.find(target => target.name === 'appImage');
  if (!isLinux) {
    return;
  }

  const originalDir = process.cwd();
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

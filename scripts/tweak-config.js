const fs = require('fs');
const path = require('path');

const isDev = process.env.STATION_DEV === '1';
const productName = isDev ? 'Station Dev' : 'Station';
// On macOS the userData path is derived from the bundle identifier, so
// the dev build needs a different appId to land in a separate folder.
// On Windows/Linux userData follows productName, so the same appId
// is harmless there.
const appId = isDev ? 'org.getstation.DesktopApp.dev' : 'org.getstation.DesktopApp';
const outputDir = isDev ? '../../release-dev' : '../../release';

const configPath = path.join(__dirname, '..', 'packages', 'app', 'electron-builder.yml');
const original = fs.readFileSync(configPath, 'utf8');

// electron-builder does not always substitute ${env.X} in every YAML
// path. The .app bundle ends up named "${env.STATION_PRODUCT_NAME}.app"
// literally. So we substitute placeholders ourselves.
const replaced = original
  .replace(/productName:\s*__STATION_PRODUCT_NAME__/, `productName: ${productName}`)
  .replace(/appId:\s*__STATION_APP_ID__/, `appId: ${appId}`)
  .replace(/output:\s*__STATION_OUTPUT_DIR__/, `output: ${outputDir}`);

fs.writeFileSync(configPath, replaced);

console.log(`[config-tweak] productName=${productName} appId=${appId} outputDir=${outputDir}`);

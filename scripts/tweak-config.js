const fs = require('fs');
const path = require('path');

const isDev = process.env.STATION_DEV === '1';
const productName = isDev ? 'Station Dev' : 'Station';
const outputDir = isDev ? '../../release-dev' : '../../release';

const configPath = path.join(__dirname, '..', 'packages', 'app', 'electron-builder.yml');
const original = fs.readFileSync(configPath, 'utf8');

// electron-builder does not always substitute ${env.X} in every YAML
// path. The .app bundle ends up named "${env.STATION_PRODUCT_NAME}.app"
// literally. So we substitute placeholders ourselves.
const replaced = original
  .replace(/productName:\s*__STATION_PRODUCT_NAME__/, `productName: ${productName}`)
  .replace(/output:\s*__STATION_OUTPUT_DIR__/, `output: ${outputDir}`);

fs.writeFileSync(configPath, replaced);

console.log(`[config-tweak] productName=${productName} outputDir=${outputDir}`);

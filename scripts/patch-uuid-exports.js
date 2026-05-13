#!/usr/bin/env node

/**
 * Patch uuid@3.x package.json to add "exports" field.
 *
 * uuid 3.x ships v4.js etc. as top-level files (require('uuid/v4')),
 * but its package.json lacks an "exports" field. Node.js 18+ (used by
 * Electron 40+) enforces the exports map and will throw:
 *   "Package subpath './v4' is not defined by exports"
 *
 * This script runs as a postinstall step to add the missing exports.
 */

const fs = require('fs');
const path = require('path');

const uuidPkgPath = path.join(__dirname, '..', 'node_modules', 'uuid', 'package.json');

try {
  const pkg = JSON.parse(fs.readFileSync(uuidPkgPath, 'utf8'));

  if (pkg.exports) {
    console.log('[patch-uuid] uuid/package.json already has exports, skipping.');
    process.exit(0);
  }

  // Only patch uuid 3.x (which has v1.js, v4.js etc. as top-level files)
  if (!fs.existsSync(path.join(__dirname, '..', 'node_modules', 'uuid', 'v4.js'))) {
    console.log('[patch-uuid] uuid/v4.js not found, skipping (probably uuid 9+).');
    process.exit(0);
  }

  pkg.exports = {
    '.': './index.js',
    './v1': './v1.js',
    './v3': './v3.js',
    './v4': './v4.js',
    './v5': './v5.js',
  };

  fs.writeFileSync(uuidPkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('[patch-uuid] Added exports field to uuid/package.json');
} catch (err) {
  console.warn('[patch-uuid] Could not patch uuid:', err.message);
  process.exit(0); // Don't fail install
}
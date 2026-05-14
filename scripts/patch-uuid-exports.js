#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function hasFile(pkgDir, relativePath) {
  return fs.existsSync(path.join(pkgDir, relativePath));
}

function legacyExport(pkgDir, name) {
  const rootFile = `./${name}.js`;
  if (hasFile(pkgDir, rootFile)) {
    return rootFile;
  }

  const distFile = `./dist/${name}.js`;
  if (!hasFile(pkgDir, distFile)) {
    return undefined;
  }

  const wrapperPath = path.join(pkgDir, `${name}.js`);
  if (!fs.existsSync(wrapperPath)) {
    fs.writeFileSync(
      wrapperPath,
      `const mod = require('./dist/${name}.js');\nmodule.exports = mod.default || mod;\n`
    );
  }

  return rootFile;
}

function patchUuidPackageJson(pkgPath) {
  if (!fs.existsSync(pkgPath)) {
    return false;
  }

  const pkgDir = path.dirname(pkgPath);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const nextExports = pkg.exports && typeof pkg.exports === 'object' ? { ...pkg.exports } : {};
  if (!nextExports['.']) {
    nextExports['.'] = pkg.main || './index.js';
  }

  let changed = false;
  for (const name of ['v1', 'v3', 'v4', 'v5']) {
    const key = `./${name}`;
    const value = legacyExport(pkgDir, name);
    if (value && nextExports[key] !== value) {
      nextExports[key] = value;
      changed = true;
    }
  }

  if (!changed && pkg.exports) {
    return false;
  }

  pkg.exports = nextExports;
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`[patch-uuid] Patched ${pkgPath}`);
  return true;
}

function patchInstalledUuidPackages() {
  const root = path.join(__dirname, '..');
  const candidates = [
    path.join(root, 'node_modules', 'uuid', 'package.json'),
    path.join(root, 'packages', 'app', 'node_modules', 'uuid', 'package.json'),
  ];

  for (const candidate of candidates) {
    patchUuidPackageJson(candidate);
  }
}

if (require.main === module) {
  patchInstalledUuidPackages();
}

module.exports = {
  patchUuidPackageJson,
};

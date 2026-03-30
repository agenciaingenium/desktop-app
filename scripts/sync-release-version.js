#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rawTag = process.argv[2] || process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME;

if (!rawTag) {
  console.error('Missing release tag. Pass it as an argument or set RELEASE_TAG/GITHUB_REF_NAME.');
  process.exit(1);
}

const version = rawTag.replace(/^v/, '');

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Invalid release tag: ${rawTag}`);
  process.exit(1);
}

const packageJsonPath = path.resolve(__dirname, '../packages/app/package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.version = version;

fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
console.log(`Updated packages/app/package.json version to ${version}`);

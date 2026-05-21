// dotenv is a Node.js module that reads .env files from disk.
// It's needed in the main process and in the hidden worker window.
// The visible renderer (target: web) gets env vars via webpack DefinePlugin instead.

import { isPackaged } from './utils/env';

const shouldLoadDotenv = process.type !== 'renderer' || Boolean((process as any).worker);

if (shouldLoadDotenv) {
  // @ts-ignore: no declaration file
  const dotenv = require('dotenv');
  const { resolve } = require('path');

  if (isPackaged) {
    dotenv.config({
      path: resolve(__dirname, '../.env.production'),
    });
  } else {
    dotenv.config({
      path: resolve(__dirname, '../../../.env.development'),
    });
  }
}

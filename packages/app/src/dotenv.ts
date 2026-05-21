// dotenv is a Node.js module that reads .env files from disk.
// It's only needed in the main process and worker.
// The renderer (target: web) gets env vars via webpack DefinePlugin instead.

import { isPackaged } from './utils/env';

if (process.type !== 'renderer') {
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
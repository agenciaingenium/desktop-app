import { join } from 'path';
import { isPackaged } from '../utils/env';
import { ProtocolHandler } from './types';

declare const __station_dev_public_path__: string;

// In packaged builds the main process is bundled to dist/main/main.js, so
// __dirname resolves to dist/main. The appstore web app lives in
// dist/renderer/appstore/, so we need to walk up to the resources root and
// then into renderer/appstore.
export default {
  hostname: 'appstore',
  filePath: isPackaged
    ? join(__dirname, '..', 'renderer', 'appstore', 'index.html')
    : join(__station_dev_public_path__, 'appstore', 'index.html'),
} as ProtocolHandler;

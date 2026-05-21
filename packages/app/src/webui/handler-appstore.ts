import { join } from 'path';
import { isPackaged } from '../utils/env';
import { ProtocolHandler } from './types';

declare const __station_dev_public_path__: string;

export default {
  hostname: 'appstore',
  filePath: join(isPackaged ? __dirname : __station_dev_public_path__, 'appstore', 'index.html'),
} as ProtocolHandler;

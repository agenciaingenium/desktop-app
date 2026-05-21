import { join } from 'path';
import { isPackaged } from '../../../utils/env';
import { ProtocolHandler } from '../../../webui/types';

declare const __station_dev_public_path__: string;

export default {
  hostname: 'multi-instance-configurator',
  filePath: join(isPackaged ? __dirname : __station_dev_public_path__, 'multi-instance-configuration.html'),
} as ProtocolHandler;

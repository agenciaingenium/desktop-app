import { join } from 'path';
import { isPackaged } from '../../../utils/env';
import { ProtocolHandler } from '../../../webui/types';

declare const __station_dev_public_path__: string;

// See handler-appstore.ts: in packaged builds __dirname is dist/main/, the
// actual HTML lives in dist/renderer/.
export default {
  hostname: 'multi-instance-configurator',
  filePath: isPackaged
    ? join(__dirname, '..', 'renderer', 'multi-instance-configuration.html')
    : join(__station_dev_public_path__, 'multi-instance-configuration.html'),
} as ProtocolHandler;

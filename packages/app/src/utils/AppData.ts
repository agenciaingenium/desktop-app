import * as fs from 'fs';
import * as path from 'path';
import * as log from 'electron-log';

function getUserDataPath(): string {
  if (process.type === 'renderer' && typeof window !== 'undefined' && (window as any).station) {
    return (window as any).station.app.getPath('userData');
  }
  return require('electron').app.getPath('userData');
}

export enum FILE {
  SHOW_RELEASE_NOTES = 'show_release_notes',
}

export const createLockFile = (file: FILE) => {
  const filepath = path.resolve(getUserDataPath(), file);

  fs.writeFile(filepath, null, (err: any) => {
    if (err) {
      log.error(`[APP DATA] Error with creation of file ${file}`);
      throw err;
    }

    log.info(`[APP DATA] The file ${file} has been saved`);
    return true;
  });
};

export const consumeLockFileIfExists = (file: FILE) => {
  const filepath = path.resolve(getUserDataPath(), file);

  return new Promise((resolve) => {
    fs.stat(filepath, (statErr) => {
      if (statErr) {
        resolve(false);
      }

      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) {
          log.error('[APP DATA]', unlinkErr);
          resolve(false);
        }

        log.info(`[APP DATA] file ${file} deleted successfully`);
        resolve(true);
      });
    });
  });
};

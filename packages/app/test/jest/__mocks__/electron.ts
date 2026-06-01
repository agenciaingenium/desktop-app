export const app = {
  name: 'Station',
  getVersion: jest.fn(() => '0.0.0-test'),
  isPackaged: true,
  getPath: jest.fn((name: string) => `/tmp/${name}`),
};

let clipboardText = '';

export const clipboard = {
  clear: jest.fn(() => {
    clipboardText = '';
  }),
  readText: jest.fn(() => clipboardText),
  writeText: jest.fn((text: string) => {
    clipboardText = text;
  }),
};

export const ipcMain = {
  on: jest.fn(),
  handle: jest.fn(),
  removeListener: jest.fn(),
};

export const webContents = {
  fromId: jest.fn(),
};

export const systemPreferences = {
  getMediaAccessStatus: jest.fn(() => 'granted'),
};

export const session = {
  fromPartition: jest.fn(() => ({
    clearCache: jest.fn(),
    cookies: {
      get: jest.fn(),
      set: jest.fn(),
    },
  })),
};

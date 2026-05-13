declare namespace NodeJS {
  interface Process extends EventEmitter {
    worker: boolean;
  }

  // Defined and ensured by `dotenv-safe`
  interface ProcessEnv {
    APP_STORE_MANIFEST_URL: string;
  }
}

// Third-party modules without type declarations
declare module 'deep-extend' {
  const deepExtend: (target: any, ...sources: any[]) => any;
  export default deepExtend;
}

declare module 'join-array' {
  const joinArray: (options: any) => (array: any[]) => string;
  export default joinArray;
}

declare module 'react-jss' {
  export function createStyles<T>(styles: T): T;
  export function withTheme<P>(component: React.ComponentType<P>): React.ComponentType<P>;
  export const ThemeProvider: React.ComponentType<{ theme: any }>;
  export const jss: any;
}

// Station preload bridge API - exposed via contextBridge in main-preload.js
interface StationWindow {
  close: () => void;
  minimize: () => void;
  maximize: () => void;
  unmaximize: () => void;
  focus: () => void;
  isFocused: () => Promise<boolean>;
  isFullScreen: () => Promise<boolean>;
  isMaximized: () => Promise<boolean>;
  setFullScreen: (flag: boolean) => void;
  toggleFullScreen: () => void;
  resetPosition: () => void;
  getId: () => number;
  getSubData: () => any;
  onFocus: (callback: () => void) => () => void;
  onBlur: (callback: () => void) => () => void;
  onClose: (callback: () => void) => () => void;
}

interface StationIpc {
  send: (channel: string, ...args: any[]) => void;
  sendSync: (channel: string, ...args: any[]) => any;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
  once: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

interface StationApp {
  getName: () => string;
  getVersion: () => string;
  getPath: (name: string) => string;
  exit: (code?: number) => void;
  quit: () => void;
}

interface StationShell {
  openExternal: (url: string) => Promise<void>;
  openPath: (path: string) => Promise<string>;
}

interface StationWebContents {
  getCurrentId: () => number;
  openDevTools: () => void;
  fromId: (id: number) => Promise<{ id: number; destroyed: boolean } | null>;
}

interface StationDialog {
  showMessageBox: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>;
}

interface StationBrowserWindow {
  getFocusedWindow: () => Promise<{ id: number } | null>;
}

interface StationClipboard {
  writeText: (text: string) => void;
  readText: () => string;
  write: (data: { text?: string; bookmark?: string }) => Promise<void>;
}

interface StationWebFrame {
  setVisualZoomLevelLimits: (min: number, max: number) => void;
}

interface Station {
  ipc: StationIpc;
  app: StationApp;
  shell: StationShell;
  window: StationWindow;
  webContents: StationWebContents;
  dialog: StationDialog;
  browserWindow: StationBrowserWindow;
  clipboard: StationClipboard;
  getGlobal: (name: string) => any;
  webFrame: StationWebFrame;
}

declare global {
  interface Window {
    station: Station;
  }
}
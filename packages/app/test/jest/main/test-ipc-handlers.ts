/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires */
const { app, clipboard, ipcMain, webContents } = require('electron');

type IpcHandler = (...args: any[]) => any;

describe('station IPC handlers', () => {
  const onHandlers = new Map<string, IpcHandler>();
  const handleHandlers = new Map<string, IpcHandler>();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { registerStationIpcHandlers, _resetRegistration } = require('../../../src/main/ipc-handlers');

  beforeEach(() => {
    onHandlers.clear();
    handleHandlers.clear();
    _resetRegistration();

    (ipcMain.on as jest.Mock).mockImplementation((channel: string, listener: IpcHandler) => {
      onHandlers.set(channel, listener);
      return ipcMain;
    });

    (ipcMain.handle as jest.Mock).mockImplementation((channel: string, listener: IpcHandler) => {
      handleHandlers.set(channel, listener);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers handlers only once', () => {
    registerStationIpcHandlers();
    registerStationIpcHandlers();

    expect((ipcMain.on as jest.Mock).mock.calls.filter(([channel]: [string]) => channel === 'station:app-getName')).toHaveLength(1);
    expect((ipcMain.handle as jest.Mock).mock.calls.filter(([channel]: [string]) => channel === 'station:webContents-fromId')).toHaveLength(1);
  });

  it('handles synchronous app metadata requests', () => {
    registerStationIpcHandlers();

    const nameEvent: { returnValue?: unknown } = {};
    onHandlers.get('station:app-getName')!(nameEvent);
    expect(nameEvent.returnValue).toBe(app.name);

    const versionEvent: { returnValue?: unknown } = {};
    onHandlers.get('station:app-getVersion')!(versionEvent);
    expect(versionEvent.returnValue).toBe(app.getVersion());

    const packagedEvent: { returnValue?: unknown } = {};
    onHandlers.get('station:app-isPackaged')!(packagedEvent);
    expect(packagedEvent.returnValue).toBe(app.isPackaged);
  });

  it('round-trips clipboard text through IPC handlers', () => {
    registerStationIpcHandlers();

    onHandlers.get('station:clipboard-writeText')!({}, 'station clipboard ipc');

    const readEvent: { returnValue?: unknown } = {};
    onHandlers.get('station:clipboard-readText')!(readEvent);

    expect(readEvent.returnValue).toBe('station clipboard ipc');
    expect(clipboard.readText()).toBe('station clipboard ipc');
  });

  it('resolves webContents lookup responses safely', async () => {
    registerStationIpcHandlers();

    (webContents.fromId as jest.Mock)
      .mockReturnValueOnce({ id: 123, isDestroyed: () => false } as any)
      .mockReturnValueOnce(undefined as any);

    await expect(handleHandlers.get('station:webContents-fromId')!({}, 123))
      .resolves.toEqual({ id: 123, destroyed: false });
    await expect(handleHandlers.get('station:webContents-fromId')!({}, 999999))
      .resolves.toBeNull();

    expect(webContents.fromId).toHaveBeenCalledWith(123);
    expect(webContents.fromId).toHaveBeenCalledWith(999999);
  });
});
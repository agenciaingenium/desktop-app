import { app, ipcRenderer, webContents } from 'electron';

const exit = () => app.exit(0);

const commands: Record<string, Function> = {
  database(args: any[]) {
    return require('./database/cli').exec(args);
  },
};

ipcRenderer.on('command', async (_e, command: string, ...args: string[]) => {
  try {
    await commands[command](args);
    exit();
  } catch (e) {
    console.error(e);
    webContents.getFocusedWebContents().openDevTools();
  }
});

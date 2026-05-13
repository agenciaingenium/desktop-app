const { app, BrowserWindow } = require('electron');
const path = require('path');

global.sharedObject = {
  mmds: process.argv.filter(x => x.endsWith('.mmd'))
};

const cliPreloadPath = path.join(__dirname, 'static/preload/cli-preload.js');

app.whenReady().then(() => {
  const bw = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: cliPreloadPath,
    },
    show: false,
  });
  const url = path.resolve(__dirname, 'cli.html');
  bw.loadURL(`file://${url}`);
});
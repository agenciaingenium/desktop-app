import { BrowserWindow, session } from 'electron';
import { enhanceSession } from '../../../src/session';

describe('session browserwindow user agent', () => {
  it('injects chromium runtime version into navigator.userAgent', async () => {
    const partition = `ua-smoke-${Date.now()}`;
    const isolatedSession = session.fromPartition(partition, { cache: false });
    enhanceSession(isolatedSession);

    const win = new BrowserWindow({
      show: false,
      webPreferences: {
        partition,
        contextIsolation: true,
      },
    });

    try {
      await win.loadURL('data:text/html,<html><body>ua-smoke</body></html>');
      const userAgent = await win.webContents.executeJavaScript('navigator.userAgent');
      expect(userAgent).toContain(`Chrome/${process.versions.chrome}`);
    }
    finally {
      if (!win.isDestroyed()) {
        win.destroy();
      }
    }
  });
});

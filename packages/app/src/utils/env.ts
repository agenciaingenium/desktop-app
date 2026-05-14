let _isPackaged = process.env.NODE_ENV !== 'test';

if (!['storybook', 'test'].includes(process.env.NODE_ENV!)) {

  _isPackaged = Boolean(
      process.type === 'renderer' && typeof window !== 'undefined' && (window as any).station
          ? (window as any).station.app.isPackaged()
          : require('electron').app.isPackaged
  );
}

export const isPackaged = _isPackaged;

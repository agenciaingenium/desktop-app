import { app } from 'electron';
import { fromEvent, Subscription } from 'rxjs';
import { ServiceSubscription } from '../../lib/class';
import { RPC, ServiceBaseConstructorOptions } from '../../lib/types';
import { AutoUpdaterService, AutoUpdaterServiceObserver } from './interface';
import { autoUpdater } from './lib';

export class AutoUpdaterServiceImpl extends AutoUpdaterService implements RPC.Interface<AutoUpdaterService> {
  private updateDownloaded: boolean;

  constructor(uuid?: string, options?: ServiceBaseConstructorOptions) {
    super(uuid, options);
    this.updateDownloaded = false;
  }

  async quitAndInstall() {
    if (this.updateDownloaded) {
      autoUpdater.quitAndInstall();
    } else {
      app.quit();
    }
  }

  async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      console.error('[auto-updater] checkForUpdates failed:', err);
    }
  }

  async addObserver(observer: RPC.ObserverNode<AutoUpdaterServiceObserver>) {
    const subscriptions: Subscription[] = [];

if (observer.onCheckingForUpdate) {
        subscriptions.push(
          fromEvent(autoUpdater as any, 'checking-for-update').subscribe(() => {
            observer.onCheckingForUpdate!();
          })
        );
      }

    if (observer.onUpdateDownloaded) {
      subscriptions.push(
        fromEvent(autoUpdater as any, 'update-downloaded', (eventOrInfo: any, _releaseNotes: any, releaseName: any) => releaseName || eventOrInfo?.version)
          .subscribe(releaseName => {
            this.updateDownloaded = true;
            observer.onUpdateDownloaded!({ releaseName });
          })
      );
    }

if (observer.onUpdateNotAvailable) {
        subscriptions.push(
          fromEvent(autoUpdater as any, 'update-not-available').subscribe(() => {
            observer.onUpdateNotAvailable!();
          })
        );
      }

      if (observer.onUpdateAvailable) {
        subscriptions.push(
          fromEvent(autoUpdater as any, 'update-available').subscribe(() => {
            observer.onUpdateAvailable!();
          })
        );
      }

      if (observer.onError) {
        subscriptions.push(
          fromEvent(autoUpdater as any, 'error').subscribe(e => {
            observer.onError!({ message: (e as any[])[0].message });
          })
        );
      }

    return new ServiceSubscription(() => {
      subscriptions.forEach(s => s.unsubscribe());
    }, observer);
  }

}

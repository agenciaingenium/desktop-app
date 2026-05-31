import { take } from 'rxjs/operators';
import ManifestProvider from '../../../applications/manifest-provider/manifest-provider';
import { RPC } from '../../lib/types';
import { ManifestService } from './interface';

export class ManifestServiceImpl extends ManifestService implements RPC.Interface<ManifestService> {
  protected manifestProvider: ManifestProvider;

  async getManifest(manifestURL: string) {
    try {
      const bxApp = await this.manifestProvider.get(manifestURL).pipe(take(1)).toPromise();
      if (!bxApp) {
        throw new Error(`Manifest not found for URL: ${manifestURL}`);
      }
      return bxApp.manifest;
    } catch (err) {
      console.error('[manifest] Failed to get manifest:', err);
      throw err;
    }
  }

  init(manifestProvider: ManifestProvider) {
    this.manifestProvider = manifestProvider;
  }
}

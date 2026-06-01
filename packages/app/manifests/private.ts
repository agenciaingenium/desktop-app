import * as fs from 'fs-extra';
import memoize from 'memoizee';
import { join } from 'path';
import { BxAppManifest } from '../src/applications/manifest-provider/bxAppManifest';
import { PrivateApplicationRequest } from '../src/plugins/bxapi';
import { Manifest } from './index';

export type BxAppManifestWithId = BxAppManifest & { id: number };

let highestId = 1000000;

function getUserDataPath() {
  if (process.type === 'renderer' && typeof window !== 'undefined' && (window as any).station) {
    return (window as any).station.app.getPath('userData');
  }
  return require('electron').app.getPath('userData');
}

const privateManifestsPath = join(getUserDataPath(), 'private-manifests.json');

const getPrivateData = memoize((): BxAppManifestWithId[] => {
  if (!fs.existsSync(privateManifestsPath)) return [];
  try {
    return fs.readJsonSync(privateManifestsPath).data as BxAppManifestWithId[];
  } catch (e) {
    console.warn(e);
  }
  return [];
}, { maxAge: 1000 });

function readOnInit() {
  highestId = getPrivateData().reduce(
    (acc: number, app: BxAppManifestWithId) => Math.max(acc, app.id),
    highestId
  );
}

export function saveNewApplication(payload: PrivateApplicationRequest) {
  highestId += 1;
  const manifest: BxAppManifestWithId = {
    name: payload.name,
    scope: payload.scope,
    icons: [
      {
        src: payload.bxIconURL,
        platform: 'browserx',
      },
    ],
    start_url: payload.startURL,
    category: 'Miscellaneous',
    theme_color: payload.themeColor,
    id: highestId,
  };

  fs.outputJSONSync(privateManifestsPath, { data: [...getPrivateData(), manifest] });
  // clear memoization cache
  getPrivateData.clear();
  return highestId;
}

export function deleteManifest(id: number) {
  const data = getPrivateData();
  fs.outputJSONSync(privateManifestsPath, { data: data.filter((app: BxAppManifestWithId) => app.id !== id) });
  // clear memoization cache
  getPrivateData.clear();
}

function cleanIcon(app: BxAppManifestWithId) {
  return {
    ...app,
    icon: app.icons![0].src,
    id: String(app.id),
  };
}

export function getPrivateManifests(): Manifest[] {
  return getPrivateData().map(cleanIcon);
}

export function getPrivateApplicationById(id: number): Manifest | undefined {
  const app = getPrivateData().find((a: BxAppManifestWithId) => a.id === id);
  if (app) {
    return cleanIcon(app);
  }
  return;
}

readOnInit();

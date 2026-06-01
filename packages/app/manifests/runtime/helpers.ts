const fs = require('fs');
const path = require('path');

export const ICON_PROVIDER_DIR = 'static/icon--provider';

export const readFile = (type: string, filename: string) =>
  fs.readFileSync(path.join(type, filename), { encoding: 'utf8' });

export const getIconPath = (iconId: string) => `${ICON_PROVIDER_DIR}/icon-provider--${iconId}.svg`;

export const RegExpKeys = ['URLHandlingIntentFilter', 'URLHandlingHostnameFilter', 'captiveURLScheme', 'restrictedEmails'];

export const flatten = (list: any[]): any[] => list.reduce(
  (a: any[], b: any): any[] => a.concat(Array.isArray(b) ? flatten(b) : b), [] as any[]
);

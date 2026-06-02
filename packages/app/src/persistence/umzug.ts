import log from 'electron-log';
import { SequelizeStorage, Umzug } from 'umzug';
import db from '../database/database';
import { DataTypes } from 'sequelize';

// Use require.context to bundle all migration files at build time.
// Runtime glob (via globby/fast-glob) fails inside Electron's asar archive
// because fs.readdir cannot traverse .asar files as directories.
// require.context is a webpack feature that resolves at build time,
// so all migration modules are included in the bundle and available
// via require() at runtime (Electron patches require() for asar).
const migrationContext = (require as any).context('./umzug-runs', false, /\.js$/);
const migrationModules: Record<string, any> = {};
migrationContext.keys().forEach((key: string) => {
  const name = key.replace('./', '');
  migrationModules[name] = migrationContext(key);
});

const umzug = new Umzug({
  context: db.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize: db }),

  migrations: Object.entries(migrationModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, mod]) => {
      const f = mod.default || mod;
      return {
        name,
        up({ context }: { context: any }) {
          return f.up(context, DataTypes);
        },
        down({ context }: { context: any }) {
          return f.down(context, DataTypes);
        }
      };
    }),
  logger: process.env.NODE_ENV === 'test' ? undefined : log
});

export default umzug;

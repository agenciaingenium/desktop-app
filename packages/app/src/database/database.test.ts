import cls from 'continuation-local-storage';
import * as path from 'path';
import Sequelize from 'sequelize';
import tmp from 'tmp';
import operatorsAliases from './operatorsAliases';

tmp.setGracefulCleanup();

export const createEngine = () => {
  const tmpDir = tmp.dirSync({
    unsafeCleanup: true,
  });

  const ns = cls.createNamespace('station');
  (Sequelize as any).useCLS(ns);
  // http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor
  const e = new (Sequelize as any)({
    database: 'station',
    dialect: 'sqlite',
    pool: {
      max: 5,
      min: 0,
      idle: 3600,
    },
    operatorsAliases,
    logging: () => {},
    transactionType: Sequelize.Transaction.TYPES.IMMEDIATE,
    storage: path.join(tmpDir.name, 'station_test.db'),
  });

  e.query('PRAGMA journal_mode = WAL;');

  return e;
};

const engine = createEngine();

export default engine;

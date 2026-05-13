import * as Sequelize from 'sequelize';

export interface UIAttributes {}

export interface UIInstance extends Sequelize.Model<UIAttributes, UIAttributes>, UIAttributes {}

export type UIModel = Sequelize.ModelCtor<UIInstance>;

export default function defineUI(db: Sequelize.Sequelize): UIModel {
  return db.define('ui', {}, { tableName: 'ui' });
}
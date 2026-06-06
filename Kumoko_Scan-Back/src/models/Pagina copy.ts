import { DataTypes, Model } from 'sequelize';
import db from '../config/database';

class Pagina extends Model {
  declare id: number;
  declare manga_id: number;
  declare capitulo_id: number;
  declare numero_pagina: number;
  declare imagem_url: string;
}

Pagina.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  manga_id: { type: DataTypes.INTEGER, allowNull: false },
  capitulo_id: { type: DataTypes.INTEGER, allowNull: false },
  numero_pagina: { type: DataTypes.INTEGER, allowNull: false },
  imagem_url: { type: DataTypes.STRING(255), allowNull: false }
}, {
  sequelize: db,
  tableName: 'paginas',
  timestamps: false
});

export default Pagina;
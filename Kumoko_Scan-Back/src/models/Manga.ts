import { DataTypes, Model } from 'sequelize';
import db from '../config/database';

class Manga extends Model {
  declare id: number;
  declare nome: string;
  declare volume: number;
  declare capa_url: string;
}

Manga.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING(255), allowNull: false },
  volume: { type: DataTypes.INTEGER, allowNull: true },
  capa_url: { type: DataTypes.STRING(255), allowNull: true }
}, {
  sequelize: db,
  tableName: 'mangas',
  timestamps: false
});

export default Manga;
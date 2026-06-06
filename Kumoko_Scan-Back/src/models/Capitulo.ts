import { DataTypes, Model } from 'sequelize';
import db from '../config/database';

class Capitulo extends Model {
  declare id: number;
  declare manga_id: number;
  declare numero: number;
  declare titulo: string;
}

Capitulo.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  manga_id: { type: DataTypes.INTEGER, allowNull: false },
  numero: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  titulo: { type: DataTypes.STRING(255), allowNull: true }
}, {
  sequelize: db,
  tableName: 'capitulos',
  timestamps: false
});

export default Capitulo;
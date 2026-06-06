import { DataTypes, Model } from 'sequelize';
import db from '../config/database';

class Livro extends Model {
  declare id: number;
  declare nome: string;
  declare capa_url: string;
}

Livro.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING(255), allowNull: false },
  capa_url: { type: DataTypes.STRING(255), allowNull: true }
}, {
  sequelize: db,
  tableName: 'livros',
  timestamps: false
});

export default Livro;
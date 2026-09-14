import { DataTypes, Model } from 'sequelize';
import db from '../config/database';

class Livro extends Model {
  declare id: number;
  declare nome: string;
  declare capa_url: string;
  declare preco: number;
  declare descricao: string;
  declare avaliacao: number;
}

Livro.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING(255), allowNull: false },
  capa_url: { type: DataTypes.STRING(255), allowNull: true },
  preco: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
  descricao: { type: DataTypes.TEXT, allowNull: true },
  avaliacao: { type: DataTypes.DECIMAL(2, 1), defaultValue: 5.0 }
}, {
  sequelize: db,
  tableName: 'livros',
  timestamps: false
});

export default Livro;
import { DataTypes, Model } from 'sequelize';
import db from '../config/database';

class Carrinho extends Model {
  declare id: number;
  declare usuario_id: number;
  declare produto_id: number;
  declare tipo_produto: string;
  declare quantidade: number;
}

Carrinho.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  produto_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo_produto: { type: DataTypes.STRING(50), allowNull: false },
  quantidade: { type: DataTypes.INTEGER, defaultValue: 1 }
}, {
  sequelize: db,
  tableName: 'carrinho',
  timestamps: false
});

export default Carrinho;
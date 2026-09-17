import { DataTypes, Model } from 'sequelize';
import db from '../config/database';

class Compra extends Model {
  declare id: number;
  declare usuario_id: number;
  declare produto_id: number;
  declare tipo_produto: string;
  declare preco_pago: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Compra.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  produto_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo_produto: { type: DataTypes.STRING(50), allowNull: false },
  preco_pago: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, {
  sequelize: db,
  tableName: 'compras',
  timestamps: true // 🎯 AGORA É TRUE: O histórico não terá mais datas vazias!
});

export default Compra;
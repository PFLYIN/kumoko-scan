import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database/index';

export class User extends Model {
  declare id: number;
  declare nome: string;
  declare email: string;
  declare cpf: string;
  declare senha: string;
  declare is_admin: boolean;
  declare total_gasto: number; // 🛒 NOVO CAMPO
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    cpf: { type: DataTypes.STRING, allowNull: false, unique: true },
    senha: { type: DataTypes.STRING, allowNull: false },
    is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
    total_gasto: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'usuarios',
    timestamps: false,
  }
);

export default User;
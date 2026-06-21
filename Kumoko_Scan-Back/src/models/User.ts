import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database/index';

export class User extends Model {
  declare id: number;
  declare nome: string;
  declare email: string;
  declare cpf: string;
  declare senha: string;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    cpf: { type: DataTypes.STRING, allowNull: false, unique: true },
    senha: { type: DataTypes.STRING, allowNull: false },
  },
  { 
    sequelize, // Passa a instância validada
    modelName: 'User',
    tableName: 'usuarios', // Força a bater na tabela exata do seu escopo SQL
    timestamps: false
  }
);

export default User;
import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Cria as tabelas do auth-service: usuarios e eventos_processados (idempotencia de eventos). */
export class CreateUsuarios1763100000000 implements MigrationInterface {
  name = 'CreateUsuarios1763100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE usuarios (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        nome VARCHAR(120) NOT NULL,
        email VARCHAR(255) NOT NULL,
        cpf CHAR(11) NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
        total_gasto DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_usuarios_email (email),
        UNIQUE KEY uq_usuarios_cpf (cpf)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE eventos_processados (
        event_id VARCHAR(36) NOT NULL,
        tipo VARCHAR(64) NOT NULL,
        processado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (event_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS eventos_processados');
    await queryRunner.query('DROP TABLE IF EXISTS usuarios');
  }
}

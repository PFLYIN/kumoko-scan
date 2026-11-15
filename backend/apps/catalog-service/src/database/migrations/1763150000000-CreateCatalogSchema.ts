import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Schema inicial do catalogo: obras, capitulos, paginas e eventos_processados (blueprint §8). */
export class CreateCatalogSchema1763150000000 implements MigrationInterface {
  name = 'CreateCatalogSchema1763150000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE obras (
        id INT NOT NULL AUTO_INCREMENT,
        tipo ENUM('manga','livro','novel') NOT NULL,
        nome VARCHAR(255) NOT NULL,
        autor VARCHAR(255) NULL,
        descricao TEXT NULL,
        volume INT NULL,
        preco DECIMAL(10,2) NOT NULL,
        avaliacao DECIMAL(2,1) NOT NULL DEFAULT 5.0,
        capa_path VARCHAR(512) NULL,
        total_vendido INT NOT NULL DEFAULT 0,
        criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_obras_tipo (tipo),
        INDEX idx_obras_nome (nome)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE capitulos (
        id INT NOT NULL AUTO_INCREMENT,
        obra_id INT NOT NULL,
        numero DECIMAL(6,2) NOT NULL,
        titulo VARCHAR(255) NULL,
        criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE INDEX uq_capitulos_obra_numero (obra_id, numero),
        CONSTRAINT fk_capitulos_obra FOREIGN KEY (obra_id) REFERENCES obras (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE paginas (
        id INT NOT NULL AUTO_INCREMENT,
        capitulo_id INT NOT NULL,
        numero INT NOT NULL,
        imagem_path VARCHAR(512) NOT NULL,
        criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE INDEX uq_paginas_capitulo_numero (capitulo_id, numero),
        CONSTRAINT fk_paginas_capitulo FOREIGN KEY (capitulo_id) REFERENCES capitulos (id) ON DELETE CASCADE
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
    await queryRunner.query('DROP TABLE IF EXISTS paginas');
    await queryRunner.query('DROP TABLE IF EXISTS capitulos');
    await queryRunner.query('DROP TABLE IF EXISTS obras');
  }
}

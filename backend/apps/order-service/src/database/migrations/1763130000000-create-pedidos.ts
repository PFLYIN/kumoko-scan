import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Cria as tabelas do contexto de Vendas: `pedidos` e `itens_pedido`. */
export class CreatePedidos1763130000000 implements MigrationInterface {
  name = 'CreatePedidos1763130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`pedidos\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`usuario_id\` INT UNSIGNED NOT NULL,
        \`status\` ENUM('CONCLUIDO','CANCELADO') NOT NULL DEFAULT 'CONCLUIDO',
        \`total\` DECIMAL(12,2) NOT NULL,
        \`idempotency_key\` VARCHAR(64) NULL,
        \`criado_em\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_pedidos_usuario_idempotency\` (\`usuario_id\`, \`idempotency_key\`),
        KEY \`idx_pedidos_usuario_criado\` (\`usuario_id\`, \`criado_em\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE \`itens_pedido\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`pedido_id\` INT UNSIGNED NOT NULL,
        \`obra_id\` INT UNSIGNED NOT NULL,
        \`nome_obra\` VARCHAR(255) NOT NULL,
        \`tipo_obra\` ENUM('manga','livro','novel') NOT NULL,
        \`capa_url\` VARCHAR(512) NULL,
        \`preco_unitario\` DECIMAL(10,2) NOT NULL,
        \`quantidade\` INT UNSIGNED NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_itens_pedido_pedido\` (\`pedido_id\`),
        KEY \`idx_itens_pedido_obra\` (\`obra_id\`),
        CONSTRAINT \`fk_itens_pedido_pedido\` FOREIGN KEY (\`pedido_id\`)
          REFERENCES \`pedidos\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `itens_pedido`');
    await queryRunner.query('DROP TABLE `pedidos`');
  }
}

import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Caminhos das variantes WebP otimizadas (capa thumb/media e pagina de leitura). NULL = ainda nao gerada. */
export class AddImageVariants1763240000000 implements MigrationInterface {
  name = 'AddImageVariants1763240000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE obras
        ADD COLUMN capa_thumb_path VARCHAR(512) NULL AFTER capa_path,
        ADD COLUMN capa_media_path VARCHAR(512) NULL AFTER capa_thumb_path
    `);
    await queryRunner.query(`
      ALTER TABLE paginas
        ADD COLUMN imagem_otimizada_path VARCHAR(512) NULL AFTER imagem_path
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE paginas DROP COLUMN imagem_otimizada_path`);
    await queryRunner.query(`ALTER TABLE obras DROP COLUMN capa_media_path, DROP COLUMN capa_thumb_path`);
  }
}

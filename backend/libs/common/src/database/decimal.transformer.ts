import type { ValueTransformer } from 'typeorm';

/**
 * O mysql2 devolve DECIMAL como string para nao perder precisao.
 * Este transformer converte para number na leitura (valores monetarios com 2 casas cabem em double).
 * Uso: `@Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })`.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value: number | null | undefined): number | null | undefined => value,
  from: (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  },
};

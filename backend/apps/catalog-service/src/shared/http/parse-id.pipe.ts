import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

export const INVALID_ID_MESSAGE = 'O identificador informado é inválido.';

/**
 * Converte o parametro de rota em inteiro positivo; caso contrario responde 400 (em portugues).
 * Aceita string ou number: o ValidationPipe global (transform) pode ja ter convertido o valor.
 */
@Injectable()
export class ParseIdPipe implements PipeTransform<unknown, number> {
  transform(value: unknown): number {
    const texto = typeof value === 'number' ? String(value) : value;
    if (typeof texto !== 'string' || !/^\d{1,10}$/.test(texto)) {
      throw new BadRequestException(INVALID_ID_MESSAGE);
    }
    const id = Number(texto);
    if (!Number.isSafeInteger(id) || id < 1 || id > 2_147_483_647) {
      throw new BadRequestException(INVALID_ID_MESSAGE);
    }
    return id;
  }
}

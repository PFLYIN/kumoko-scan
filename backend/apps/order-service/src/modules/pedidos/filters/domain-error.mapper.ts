import { BadRequestException, type HttpException, UnprocessableEntityException } from '@nestjs/common';
import { type DomainError, ValorInvalidoError } from '../domain/domain-error';

/** Traduz erros de dominio para HTTP: valor invalido -> 400; regra de negocio violada -> 422. */
export function domainErrorToHttp(error: DomainError): HttpException {
  if (error instanceof ValorInvalidoError) {
    return new BadRequestException(error.message);
  }
  return new UnprocessableEntityException(error.message);
}

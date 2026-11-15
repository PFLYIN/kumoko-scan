/** Violacao de regra de negocio de obra (convertida em 400 pela camada de aplicacao). */
export class ObraDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ObraDomainError';
  }
}

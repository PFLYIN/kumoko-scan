/**
 * Base de todos os erros de dominio do contexto de Vendas.
 * O dominio nao conhece HTTP: a traducao para status (400/422) fica no DomainErrorFilter.
 */
export abstract class DomainError extends Error {
  /** Codigo estavel do erro (util para logs e testes). */
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Valor que nao pode existir no dominio (ex.: quantidade 0, preco negativo). */
export abstract class ValorInvalidoError extends DomainError {}

/** Violacao de regra de negocio do aggregate (ex.: pedido vazio, mais de 20 obras). */
export abstract class RegraDeNegocioError extends DomainError {}

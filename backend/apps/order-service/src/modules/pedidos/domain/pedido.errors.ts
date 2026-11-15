import { RegraDeNegocioError, ValorInvalidoError } from './domain-error';
import { MAX_ITENS_DISTINTOS, QUANTIDADE_MAXIMA, QUANTIDADE_MINIMA } from './pedido.constants';

export class DinheiroInvalidoError extends ValorInvalidoError {
  readonly code = 'DINHEIRO_INVALIDO';

  constructor(valor: unknown) {
    super(`Valor monetário inválido: ${String(valor)}. Use um número não negativo com até 2 casas.`);
  }
}

export class QuantidadeInvalidaError extends ValorInvalidoError {
  readonly code = 'QUANTIDADE_INVALIDA';

  constructor(valor: unknown) {
    super(
      `Quantidade inválida: ${String(valor)}. Informe um inteiro entre ${QUANTIDADE_MINIMA} e ${QUANTIDADE_MAXIMA}.`,
    );
  }
}

export class ObraRefInvalidaError extends ValorInvalidoError {
  readonly code = 'OBRA_REF_INVALIDA';

  constructor(motivo: string) {
    super(`Referência de obra inválida: ${motivo}`);
  }
}

export class IdempotencyKeyInvalidaError extends ValorInvalidoError {
  readonly code = 'IDEMPOTENCY_KEY_INVALIDA';

  constructor() {
    super('Idempotency-Key inválida: use de 1 a 64 caracteres entre letras, números, "-" e "_".');
  }
}

export class UsuarioInvalidoError extends ValorInvalidoError {
  readonly code = 'USUARIO_INVALIDO';

  constructor(usuarioId: unknown) {
    super(`Identificador de usuário inválido: ${String(usuarioId)}.`);
  }
}

export class PedidoVazioError extends RegraDeNegocioError {
  readonly code = 'PEDIDO_VAZIO';

  constructor() {
    super('O pedido deve ter pelo menos 1 item.');
  }
}

export class LimiteDeItensExcedidoError extends RegraDeNegocioError {
  readonly code = 'LIMITE_DE_ITENS_EXCEDIDO';

  constructor(quantidadeDeObras: number) {
    super(
      `O pedido pode ter no máximo ${MAX_ITENS_DISTINTOS} obras distintas (recebidas: ${quantidadeDeObras}).`,
    );
  }
}

export class QuantidadeMaximaPorObraExcedidaError extends RegraDeNegocioError {
  readonly code = 'QUANTIDADE_MAXIMA_POR_OBRA_EXCEDIDA';

  constructor(obraId: number, quantidadeTotal: number) {
    super(
      `A quantidade total da obra ${obraId} (${quantidadeTotal}) excede o máximo de ${QUANTIDADE_MAXIMA} unidades.`,
    );
  }
}

export class PrecoDivergenteError extends RegraDeNegocioError {
  readonly code = 'PRECO_DIVERGENTE';

  constructor(obraId: number) {
    super(`A obra ${obraId} aparece no pedido com preços diferentes.`);
  }
}

export class PedidoJaPersistidoError extends RegraDeNegocioError {
  readonly code = 'PEDIDO_JA_PERSISTIDO';

  constructor(pedidoId: number) {
    super(`O pedido ${pedidoId} já possui identidade e não pode recebê-la novamente.`);
  }
}

/**
 * Lancado pelo repositorio quando ja existe pedido com a mesma Idempotency-Key para o usuario
 * (corrida entre requisicoes simultaneas). O caso de uso responde com o pedido existente.
 */
export class IdempotenciaConflitoError extends RegraDeNegocioError {
  readonly code = 'IDEMPOTENCIA_CONFLITO';

  constructor(usuarioId: number, chave: string) {
    super(`Já existe um pedido do usuário ${usuarioId} com a Idempotency-Key ${chave}.`);
  }
}

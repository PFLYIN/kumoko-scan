import { TIPOS_OBRA, type TipoObra } from './pedido.constants';
import { ObraRefInvalidaError } from './pedido.errors';

export interface ObraRefProps {
  obraId: number;
  nome: string;
  tipo: TipoObra;
  capaUrl: string | null;
}

const NOME_MAX = 255;

/**
 * Value Object: snapshot da obra no momento da compra (id, nome, tipo, capa).
 * O pedido guarda a referencia para o historico continuar legivel mesmo se a obra mudar no catalogo.
 */
export class ObraRef {
  private constructor(private readonly props: Readonly<ObraRefProps>) {}

  static criar(props: ObraRefProps): ObraRef {
    if (!Number.isSafeInteger(props.obraId) || props.obraId <= 0) {
      throw new ObraRefInvalidaError(`obraId deve ser inteiro positivo (recebido: ${String(props.obraId)})`);
    }
    const nome = typeof props.nome === 'string' ? props.nome.trim() : '';
    if (nome.length === 0 || nome.length > NOME_MAX) {
      throw new ObraRefInvalidaError(`nome da obra ${props.obraId} deve ter de 1 a ${NOME_MAX} caracteres`);
    }
    if (!(TIPOS_OBRA as readonly string[]).includes(props.tipo)) {
      throw new ObraRefInvalidaError(`tipo da obra ${props.obraId} inválido (${String(props.tipo)})`);
    }
    const capaUrl = typeof props.capaUrl === 'string' && props.capaUrl.length > 0 ? props.capaUrl : null;
    return new ObraRef(Object.freeze({ obraId: props.obraId, nome, tipo: props.tipo, capaUrl }));
  }

  get obraId(): number {
    return this.props.obraId;
  }

  get nome(): string {
    return this.props.nome;
  }

  get tipo(): TipoObra {
    return this.props.tipo;
  }

  get capaUrl(): string | null {
    return this.props.capaUrl;
  }

  equals(outra: ObraRef): boolean {
    return (
      this.obraId === outra.obraId &&
      this.nome === outra.nome &&
      this.tipo === outra.tipo &&
      this.capaUrl === outra.capaUrl
    );
  }

  toJSON(): ObraRefProps {
    return { ...this.props };
  }
}

import type { TransformFnParams } from 'class-transformer';

/**
 * Helpers de @Transform para campos que chegam como string em multipart/form-data.
 * Leem o valor ORIGINAL (`obj[key]`) para nao depender da ordem de conversao do class-transformer.
 */
function rawValue({ obj, key, value }: TransformFnParams): unknown {
  return obj && typeof obj === 'object' && key in obj ? (obj as Record<string, unknown>)[key] : value;
}

/** Texto obrigatorio: aplica trim quando for string. */
export function trimString(params: TransformFnParams): unknown {
  const value = rawValue(params);
  return typeof value === 'string' ? value.trim() : value;
}

/** Texto opcional: trim, e '' (ou so espacos) vira null para limpar o campo. */
export function trimToNull(params: TransformFnParams): unknown {
  const value = rawValue(params);
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** Numero: '12.5' -> 12.5; texto invalido -> NaN (a validacao rejeita); undefined/null preservados. */
export function toNumber(params: TransformFnParams): unknown {
  const value = rawValue(params);
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(',', '.');
    return trimmed === '' ? Number.NaN : Number(trimmed);
  }
  return value;
}

/** Numero opcional e anulavel: '' vira null (limpa o campo); demais regras iguais a toNumber. */
export function toNullableNumber(params: TransformFnParams): unknown {
  const value = rawValue(params);
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }
  return toNumber(params);
}

/** Numero opcional: '' vira undefined (campo ausente, usa o padrao); demais regras iguais a toNumber. */
export function toOptionalNumber(params: TransformFnParams): unknown {
  const value = rawValue(params);
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return toNumber(params);
}

/**
 * Lista separada por virgula (multipart) -> string[] bruto; a normalizacao/validacao fica no dominio.
 * Aceita tambem campo repetido (array). '' vira [] (limpa a lista).
 */
export function toGenerosList(params: TransformFnParams): unknown {
  const value = rawValue(params);
  if (value === undefined || value === null) {
    return value;
  }
  const itens = Array.isArray(value) ? value : [value];
  if (!itens.every((item) => typeof item === 'string')) {
    return value;
  }
  return itens
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

/** Query string opcional: '' (ou so espacos) vira undefined, como se o parametro nao fosse enviado. */
export function emptyToUndefined(params: TransformFnParams): unknown {
  const value = rawValue(params);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  return value;
}

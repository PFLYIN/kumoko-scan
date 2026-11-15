/** Formatos aceitos: somente digitos (11) ou com mascara 000.000.000-00 (pontos e hifen opcionais). */
const CPF_INPUT_PATTERN = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

/** Calcula um digito verificador do CPF considerando os `limite` primeiros digitos. */
function calcularDigito(digitos: string, limite: number): number {
  let soma = 0;
  for (let i = 0; i < limite; i++) {
    soma += Number(digitos[i]) * (limite + 1 - i);
  }
  const resto = (soma * 10) % 11;
  return resto >= 10 ? 0 : resto;
}

/**
 * Normaliza um CPF com ou sem mascara para 11 digitos.
 * Retorna null se o formato nao for reconhecido (nao valida os digitos verificadores).
 */
export function normalizeCpf(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!CPF_INPUT_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed.replace(/\D/g, '');
}

/** Valida formato e digitos verificadores (rejeita sequencias repetidas como 111.111.111-11). */
export function isValidCpf(value: unknown): boolean {
  const digitos = normalizeCpf(value);
  if (!digitos || /^(\d)\1{10}$/.test(digitos)) {
    return false;
  }
  return (
    calcularDigito(digitos, 9) === Number(digitos[9]) && calcularDigito(digitos, 10) === Number(digitos[10])
  );
}

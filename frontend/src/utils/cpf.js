// Mesmo algoritmo de validacao de CPF usado no backend (digitos verificadores).

export function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

export function isCpfValid(cpf) {
  const c = onlyDigits(cpf);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;

  const calcDigito = (limite) => {
    let soma = 0;
    for (let i = 0; i < limite; i++) soma += Number(c[i]) * (limite + 1 - i);
    const resto = (soma * 10) % 11;
    return resto >= 10 ? 0 : resto;
  };

  return calcDigito(9) === Number(c[9]) && calcDigito(10) === Number(c[10]);
}

// Aplica a mascara 000.000.000-00 progressivamente enquanto o usuario digita.
export function maskCpf(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export const isEmailValid = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const isPasswordStrong = (senha: string): boolean => {
  return senha.length >= 8;
};

export const isCpfValid = (cpf: string): boolean => {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;

  const calcDigito = (limite: number) => {
    let soma = 0;
    for (let i = 0; i < limite; i++) soma += parseInt(c[i]) * (limite + 1 - i);
    const resto = (soma * 10) % 11;
    return resto >= 10 ? 0 : resto;
  };

  return calcDigito(9) === parseInt(c[9]) && calcDigito(10) === parseInt(c[10]);
};
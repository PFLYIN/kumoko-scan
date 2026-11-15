/** Politica de senha: minimo de 8 caracteres, com pelo menos uma letra e um numero. */
export const PASSWORD_MIN_LENGTH = 8;

/** Limite pratico do bcrypt (72 bytes); acima disso o restante e ignorado. */
export const PASSWORD_MAX_LENGTH = 72;

/** Regex da politica, util em DTOs: `@Matches(PASSWORD_POLICY_REGEX, { message: PASSWORD_POLICY_MESSAGE })`. */
export const PASSWORD_POLICY_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

export const PASSWORD_POLICY_MESSAGE =
  'A senha deve ter no mínimo 8 caracteres, com pelo menos uma letra e um número.';

export function isStrongPassword(value: unknown): value is string {
  return typeof value === 'string' && PASSWORD_POLICY_REGEX.test(value);
}

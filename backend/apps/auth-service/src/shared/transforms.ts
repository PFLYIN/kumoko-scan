import { normalizeEmail } from '../modules/users/domain/email';

/** `@Transform(trimString)`: remove espacos das pontas de strings. */
export function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** `@Transform(toNormalizedEmail)`: trim + minusculas. */
export function toNormalizedEmail({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? normalizeEmail(value) : value;
}

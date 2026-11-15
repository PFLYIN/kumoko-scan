import { registerDecorator, type ValidationOptions } from 'class-validator';
import { isValidCpf, normalizeCpf } from '../domain/cpf';
import { UsuarioMessages } from '../domain/usuario.messages';

/** Valida CPF (com ou sem mascara) pelos digitos verificadores. */
export function IsCpf(options?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isCpf',
      target: target.constructor,
      propertyName: String(propertyName),
      options: { message: UsuarioMessages.CPF_INVALIDO, ...options },
      validator: {
        validate: (value: unknown) => isValidCpf(value),
      },
    });
  };
}

/**
 * Uso com `@Transform`: converte CPF com mascara para 11 digitos. Valores em formato
 * desconhecido sao mantidos como vieram para que o @IsCpf os rejeite.
 */
export function toNormalizedCpf({ value }: { value: unknown }): unknown {
  return normalizeCpf(value) ?? value;
}

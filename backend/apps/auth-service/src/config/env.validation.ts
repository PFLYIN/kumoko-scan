import { baseEnvSchema } from '@kumoko/common';
import { DURATION_PATTERN, PASSWORD_POLICY_REGEX } from '@kumoko/security';
import Joi from 'joi';
import { isValidCpf } from '../modules/users/domain/cpf';

export const AUTH_SERVICE_NAME = 'auth-service';

/** Variaveis do auth-service: base + JWT_EXPIRES_IN, ADMIN_* e COOKIE_SECURE. */
export const authEnvSchema = baseEnvSchema.keys({
  PORT: Joi.number().port().default(3001),
  SERVICE_NAME: Joi.string().default(AUTH_SERVICE_NAME),
  JWT_EXPIRES_IN: Joi.string().pattern(DURATION_PATTERN).default('1h'),
  ADMIN_NAME: Joi.string().trim().min(2).max(120).required(),
  ADMIN_EMAIL: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .required(),
  // Mesma politica de senha dos usuarios (falha rapido no boot se for fraca).
  ADMIN_PASSWORD: Joi.string().pattern(PASSWORD_POLICY_REGEX).required(),
  // Formato e digitos verificadores (o seeder grava o CPF normalizado com 11 digitos).
  ADMIN_CPF: Joi.string()
    .pattern(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/)
    .custom((value: string, helpers) => (isValidCpf(value) ? value : helpers.error('any.invalid')))
    .required(),
  COOKIE_SECURE: Joi.boolean().default(true),
});

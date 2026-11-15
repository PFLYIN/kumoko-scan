import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/** Converte erros do class-validator em mensagens unicas em portugues (string[]). */
export function formatValidationErrors(errors: ValidationError[], parentPath = ''): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const constraints = error.constraints ?? {};
    for (const [key, message] of Object.entries(constraints)) {
      messages.push(key === 'whitelistValidation' ? `O campo ${path} não é permitido.` : message);
    }
    if (error.children?.length) {
      messages.push(...formatValidationErrors(error.children, path));
    }
  }
  return [...new Set(messages)];
}

/** ValidationPipe global padrao: whitelist estrita, transformacao e primeiro erro por campo. */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    stopAtFirstError: true,
    exceptionFactory: (errors) => new BadRequestException(formatValidationErrors(errors)),
  });
}

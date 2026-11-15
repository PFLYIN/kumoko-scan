import { BadRequestException } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { createValidationPipe } from './validation-pipe';

class Dto {
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(3, { message: 'O nome deve ter ao menos 3 caracteres.' })
  nome!: string;
}

async function messagesFor(body: unknown): Promise<string[]> {
  try {
    await createValidationPipe().transform(body, { type: 'body', metatype: Dto });
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return ((error as BadRequestException).getResponse() as { message: string[] }).message;
  }
  throw new Error('esperava falha de validacao');
}

describe('createValidationPipe', () => {
  it('retorna apenas o primeiro erro de cada campo', async () => {
    expect(await messagesFor({ nome: 5 })).toHaveLength(1);
  });

  it('traduz campo nao permitido para portugues', async () => {
    expect(await messagesFor({ nome: 'abcd', extra: 1 })).toEqual(['O campo extra não é permitido.']);
  });
});

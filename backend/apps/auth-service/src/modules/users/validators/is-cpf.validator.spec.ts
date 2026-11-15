import { plainToInstance, Transform } from 'class-transformer';
import { validateSync } from 'class-validator';
import { isValidCpf, normalizeCpf } from '../domain/cpf';
import { IsCpf, toNormalizedCpf } from './is-cpf.validator';

class Dto {
  @Transform(toNormalizedCpf)
  @IsCpf()
  cpf: unknown;
}

function validar(cpf: unknown): { valor: unknown; erros: string[] } {
  const dto = plainToInstance(Dto, { cpf });
  const erros = validateSync(dto).flatMap((e) => Object.values(e.constraints ?? {}));
  return { valor: dto.cpf, erros };
}

describe('CPF', () => {
  it('normaliza com e sem mascara para 11 digitos', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
    expect(normalizeCpf(' 52998224725 ')).toBe('52998224725');
    expect(normalizeCpf('529-982.247.25')).toBeNull();
    expect(normalizeCpf(123)).toBeNull();
  });

  it('valida digitos verificadores', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('52998224724')).toBe(false);
    expect(isValidCpf('111.111.111-11')).toBe(false);
    expect(isValidCpf('1234567890')).toBe(false);
    expect(isValidCpf(undefined)).toBe(false);
  });

  it('@IsCpf aceita CPF mascarado e normaliza o valor', () => {
    expect(validar('529.982.247-25')).toEqual({ valor: '52998224725', erros: [] });
  });

  it('@IsCpf rejeita CPF invalido com mensagem em portugues', () => {
    expect(validar('123.456.789-00').erros).toEqual(['CPF inválido.']);
    expect(validar('abc').erros).toEqual(['CPF inválido.']);
    expect(validar(null).erros).toEqual(['CPF inválido.']);
  });
});

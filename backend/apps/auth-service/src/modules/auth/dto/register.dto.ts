import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_REGEX } from '@kumoko/security';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import { toNormalizedEmail, trimString } from '../../../shared/transforms';
import { IsCpf, toNormalizedCpf } from '../../users/validators/is-cpf.validator';

/** POST /api/auth/register. Cadastro publico sempre cria um `customer`. */
export class RegisterDto {
  @ApiProperty({ minLength: 2, maxLength: 120, example: 'Maria Souza' })
  @Transform(trimString)
  @IsString({ message: 'O nome deve ser um texto.' })
  @Length(2, 120, { message: 'O nome deve ter entre 2 e 120 caracteres.' })
  nome: string;

  @ApiProperty({ maxLength: 255, example: 'maria@exemplo.com', description: 'Normalizado para minusculas.' })
  @Transform(toNormalizedEmail)
  @IsString({ message: 'Informe um e-mail válido.' })
  @MaxLength(255, { message: 'O e-mail deve ter no máximo 255 caracteres.' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @ApiProperty({
    example: '529.982.247-25',
    description: 'Com ou sem mascara; armazenado com 11 digitos.',
  })
  @Transform(toNormalizedCpf)
  @IsCpf()
  cpf: string;

  @ApiProperty({ minLength: 8, maxLength: 72, example: 'Senha123', description: PASSWORD_POLICY_MESSAGE })
  @IsString({ message: PASSWORD_POLICY_MESSAGE })
  @Matches(PASSWORD_POLICY_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  senha: string;
}

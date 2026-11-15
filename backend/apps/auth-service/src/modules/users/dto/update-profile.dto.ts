import { ApiPropertyOptional } from '@nestjs/swagger';
import { PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_REGEX } from '@kumoko/security';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { trimString } from '../../../shared/transforms';
import { UsuarioMessages } from '../domain/usuario.messages';

/** PATCH /api/users/me: campos opcionais; senhaAtual e obrigatoria quando novaSenha e enviada. */
export class UpdateProfileDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 120, example: 'Maria S. Souza' })
  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'O nome deve ser um texto.' })
  @Length(2, 120, { message: 'O nome deve ter entre 2 e 120 caracteres.' })
  nome?: string;

  @ApiPropertyOptional({
    description: 'Obrigatoria quando novaSenha for informada.',
    example: 'SenhaAtual123',
  })
  // Ausencia com novaSenha presente e tratada no service (400 com mensagem unica).
  @IsOptional()
  @IsString({ message: UsuarioMessages.SENHA_ATUAL_OBRIGATORIA })
  @MaxLength(72, { message: 'A senha atual deve ter no máximo 72 caracteres.' })
  senhaAtual?: string;

  @ApiPropertyOptional({ description: PASSWORD_POLICY_MESSAGE, example: 'NovaSenha456' })
  @IsOptional()
  @IsString({ message: PASSWORD_POLICY_MESSAGE })
  @Matches(PASSWORD_POLICY_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  novaSenha?: string;
}

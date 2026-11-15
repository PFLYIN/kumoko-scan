import { ApiProperty } from '@nestjs/swagger';
import { UsuarioResponseDto } from '../../users/dto/usuario-response.dto';

/** Resposta do login. O mesmo token tambem e enviado no cookie httpOnly `kumoko_token`. */
export class LoginResponseDto {
  @ApiProperty({ description: 'JWT HS256 (tambem enviado no cookie httpOnly kumoko_token).' })
  accessToken: string;

  @ApiProperty({ enum: ['Bearer'], example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({ example: 3600, description: 'Validade do token em segundos.' })
  expiresIn: number;

  @ApiProperty({ type: UsuarioResponseDto })
  usuario: UsuarioResponseDto;
}

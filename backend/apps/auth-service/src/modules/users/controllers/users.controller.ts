import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AUTH_COOKIE_NAME, CurrentUser } from '@kumoko/security';
import { ErrorResponseDto } from '../../../shared/dto/error-response.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UsuarioResponseDto } from '../dto/usuario-response.dto';
import { toUsuarioResponse } from '../mappers/usuario.mapper';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@ApiBearerAuth()
@ApiCookieAuth(AUTH_COOKIE_NAME)
@ApiUnauthorizedResponse({ description: 'Token ausente, invalido ou expirado.', type: ErrorResponseDto })
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Perfil do usuario autenticado' })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiNotFoundResponse({ description: 'Usuario do token nao existe mais.', type: ErrorResponseDto })
  async me(@CurrentUser('id') usuarioId: number): Promise<UsuarioResponseDto> {
    return toUsuarioResponse(await this.usersService.getProfile(usuarioId));
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Atualiza nome e/ou senha do usuario autenticado',
    description: 'Para trocar a senha, envie senhaAtual e novaSenha.',
  })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiBadRequestResponse({
    description: 'Dados invalidos, senha atual ausente/incorreta ou nova senha fraca.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Usuario do token nao existe mais.', type: ErrorResponseDto })
  async updateMe(
    @CurrentUser('id') usuarioId: number,
    @Body() dto: UpdateProfileDto,
  ): Promise<UsuarioResponseDto> {
    return toUsuarioResponse(await this.usersService.updateProfile(usuarioId, dto));
  }
}

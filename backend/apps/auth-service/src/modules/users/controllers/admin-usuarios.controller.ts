import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AUTH_COOKIE_NAME, CurrentUser, Roles } from '@kumoko/security';
import { ErrorResponseDto } from '../../../shared/dto/error-response.dto';
import {
  AlterarRoleDto,
  ListarUsuariosQueryDto,
  PaginatedUsuarioResponseDto,
  ResumoUsuariosResponseDto,
} from '../dto/admin-usuarios.dto';
import { UsuarioResponseDto } from '../dto/usuario-response.dto';
import { AdminUsuariosService } from '../services/admin-usuarios.service';

/** Gestao de usuarios pelo administrador. */
@ApiTags('users (admin)')
@ApiBearerAuth()
@ApiCookieAuth(AUTH_COOKIE_NAME)
@ApiUnauthorizedResponse({ description: 'Token ausente, invalido ou expirado.', type: ErrorResponseDto })
@ApiForbiddenResponse({ description: 'Apenas administradores.', type: ErrorResponseDto })
@Roles('admin')
@Controller('users')
export class AdminUsuariosController {
  constructor(private readonly admin: AdminUsuariosService) {}

  @Get('admin/resumo')
  @ApiOperation({ summary: 'Contadores de usuarios (clientes, admins, novos em 30 dias, compradores)' })
  @ApiOkResponse({ type: ResumoUsuariosResponseDto })
  resumo(): Promise<ResumoUsuariosResponseDto> {
    return this.admin.resumo();
  }

  @Get('admin')
  @ApiOperation({ summary: 'Lista usuarios com busca por nome/e-mail, filtro de papel e ordenacao' })
  @ApiOkResponse({ type: PaginatedUsuarioResponseDto })
  @ApiBadRequestResponse({ description: 'Filtros invalidos.', type: ErrorResponseDto })
  listar(@Query() query: ListarUsuariosQueryDto): Promise<PaginatedUsuarioResponseDto> {
    return this.admin.listar(query);
  }

  @Patch(':id/role')
  @ApiOperation({
    summary: 'Promove ou rebaixa um usuario',
    description:
      'O admin nao pode alterar o proprio papel (400) nem remover o ultimo administrador (409). ' +
      'O novo papel vale no proximo login do usuario (o JWT atual continua com o papel antigo ate expirar).',
  })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiBadRequestResponse({ description: 'Role invalido ou tentativa de alterar o proprio papel.', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Usuario inexistente.', type: ErrorResponseDto })
  @ApiConflictResponse({ description: 'Removeria o ultimo administrador.', type: ErrorResponseDto })
  alterarRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AlterarRoleDto,
    @CurrentUser('id') atorId: number,
  ): Promise<UsuarioResponseDto> {
    return this.admin.alterarRole(id, dto.role, atorId);
  }
}

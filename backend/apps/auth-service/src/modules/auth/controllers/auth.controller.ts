import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AUTH_COOKIE_NAME,
  AUTH_THROTTLE,
  buildAuthCookieOptions,
  buildClearAuthCookieOptions,
  Public,
  Throttle,
} from '@kumoko/security';
import type { Response } from 'express';
import { ErrorResponseDto } from '../../../shared/dto/error-response.dto';
import { UsuarioResponseDto } from '../../users/dto/usuario-response.dto';
import { toUsuarioResponse } from '../../users/mappers/usuario.mapper';
import { LoginResponseDto } from '../dto/login-response.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  @ApiOperation({ summary: 'Cadastro publico de cliente (role customer)' })
  @ApiCreatedResponse({ type: UsuarioResponseDto })
  @ApiBadRequestResponse({
    description: 'CPF invalido, senha fraca ou dados invalidos.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({ description: 'E-mail ou CPF ja cadastrado.', type: ErrorResponseDto })
  @ApiTooManyRequestsResponse({ description: 'Limite de 5 tentativas por minuto.', type: ErrorResponseDto })
  async register(@Body() dto: RegisterDto): Promise<UsuarioResponseDto> {
    return toUsuarioResponse(await this.authService.register(dto));
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login com e-mail e senha',
    description: 'Retorna o JWT no corpo e tambem no cookie httpOnly kumoko_token (Set-Cookie).',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({ description: 'Corpo invalido.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Credenciais invalidas (resposta generica).',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({ description: 'Limite de 5 tentativas por minuto.', type: ErrorResponseDto })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<LoginResponseDto> {
    const result = await this.authService.login(dto);
    res.cookie(AUTH_COOKIE_NAME, result.accessToken, buildAuthCookieOptions(this.config));
    return result;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout: remove o cookie de sessao' })
  @ApiNoContentResponse({ description: 'Cookie kumoko_token removido.' })
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(AUTH_COOKIE_NAME, buildClearAuthCookieOptions(this.config));
  }
}

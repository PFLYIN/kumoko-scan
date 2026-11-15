import {
  ConflictException,
  Injectable,
  Logger,
  type OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PasswordHasher, parseDurationToSeconds, toJwtPayload } from '@kumoko/security';
import { randomBytes } from 'node:crypto';
import { normalizeCpf } from '../../users/domain/cpf';
import { maskEmail, normalizeEmail } from '../../users/domain/email';
import { UsuarioMessages } from '../../users/domain/usuario.messages';
import type { User } from '../../users/entities/user.entity';
import { toAuthenticatedUser, toUsuarioResponse } from '../../users/mappers/usuario.mapper';
import { UsersService } from '../../users/services/users.service';
import type { LoginResponseDto } from '../dto/login-response.dto';
import type { LoginDto } from '../dto/login.dto';
import type { RegisterDto } from '../dto/register.dto';
import { UsuarioRegistradoPublisher } from '../events/usuario-registrado.publisher';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly expiresInSeconds: number;
  /** Hash de uma senha aleatoria: comparado quando o e-mail nao existe (tempo de resposta uniforme). */
  private dummyHash?: Promise<string>;

  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly publisher: UsuarioRegistradoPublisher,
    config: ConfigService,
  ) {
    this.expiresInSeconds = parseDurationToSeconds(config.get<string>('JWT_EXPIRES_IN') ?? '1h');
  }

  async onModuleInit(): Promise<void> {
    await this.getDummyHash();
  }

  async register(dto: RegisterDto): Promise<User> {
    const email = normalizeEmail(dto.email);
    const cpf = normalizeCpf(dto.cpf) ?? dto.cpf;

    if (await this.usersService.findByEmail(email)) {
      this.logger.warn(`Cadastro recusado (e-mail ja cadastrado) email=${maskEmail(email)}`);
      throw new ConflictException(UsuarioMessages.EMAIL_DUPLICADO);
    }
    if (await this.usersService.findByCpf(cpf)) {
      this.logger.warn(`Cadastro recusado (CPF ja vinculado) email=${maskEmail(email)}`);
      throw new ConflictException(UsuarioMessages.CPF_DUPLICADO);
    }

    const user = await this.usersService.create({
      nome: dto.nome.trim(),
      email,
      cpf,
      senhaHash: await this.passwordHasher.hash(dto.senha),
      // Cadastro publico nunca cria administrador.
      role: 'customer',
    });
    this.logger.log(`Usuario registrado usuarioId=${user.id} email=${maskEmail(user.email)}`);
    await this.publisher.publish(user);
    return user;
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const email = normalizeEmail(dto.email);
    const user = await this.usersService.findByEmail(email);
    // Sempre executa o bcrypt, mesmo sem usuario, para nao revelar quais e-mails existem.
    const hash = user?.senhaHash ?? (await this.getDummyHash());
    const senhaConfere = await this.passwordHasher.compare(dto.senha, hash);

    if (!user || !senhaConfere) {
      this.logger.warn(`Login recusado email=${maskEmail(email)} motivo=credenciais-invalidas`);
      throw new UnauthorizedException(UsuarioMessages.CREDENCIAIS_INVALIDAS);
    }

    const accessToken = await this.jwtService.signAsync(toJwtPayload(toAuthenticatedUser(user)));
    this.logger.log(`Login realizado usuarioId=${user.id} role=${user.role}`);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.expiresInSeconds,
      usuario: toUsuarioResponse(user),
    };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.passwordHasher.hash(randomBytes(32).toString('hex'));
    return this.dummyHash;
  }
}

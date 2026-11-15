import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordHasher, type UserRole } from '@kumoko/security';
import { Repository } from 'typeorm';
import { isDuplicateEntryError } from '../../../shared/database-errors';
import { UsuarioMessages } from '../domain/usuario.messages';
import type { UpdateProfileDto } from '../dto/update-profile.dto';
import { User } from '../entities/user.entity';

/** Indices unicos definidos na migration (usados para traduzir violacoes em 409). */
export const UQ_USUARIOS_EMAIL = 'uq_usuarios_email';
export const UQ_USUARIOS_CPF = 'uq_usuarios_cpf';

export interface NovoUsuario {
  nome: string;
  email: string;
  cpf: string;
  senhaHash: string;
  role: UserRole;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  findById(id: number): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  /** Espera o e-mail ja normalizado (trim + minusculas). */
  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  /** Espera o CPF ja normalizado (11 digitos). */
  findByCpf(cpf: string): Promise<User | null> {
    return this.users.findOne({ where: { cpf } });
  }

  /** Insere o usuario; violacao de indice unico (corrida entre requisicoes) vira 409. */
  create(data: NovoUsuario): Promise<User> {
    return this.save(this.users.create({ ...data, totalGasto: 0 }));
  }

  /** Persiste alteracoes traduzindo chave duplicada em 409. */
  async save(user: User): Promise<User> {
    try {
      return await this.users.save(user);
    } catch (error) {
      if (isDuplicateEntryError(error, UQ_USUARIOS_EMAIL)) {
        throw new ConflictException(UsuarioMessages.EMAIL_DUPLICADO);
      }
      if (isDuplicateEntryError(error, UQ_USUARIOS_CPF)) {
        throw new ConflictException(UsuarioMessages.CPF_DUPLICADO);
      }
      throw error;
    }
  }

  async getProfile(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(UsuarioMessages.USUARIO_NAO_ENCONTRADO);
    }
    return user;
  }

  /** Atualiza nome e/ou senha. Trocar a senha exige a senha atual correta. */
  async updateProfile(id: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.getProfile(id);
    const alterados: string[] = [];

    if (dto.novaSenha !== undefined) {
      if (!dto.senhaAtual) {
        throw new BadRequestException(UsuarioMessages.SENHA_ATUAL_OBRIGATORIA);
      }
      const senhaConfere = await this.passwordHasher.compare(dto.senhaAtual, user.senhaHash);
      if (!senhaConfere) {
        this.logger.warn(`Troca de senha recusada (senha atual incorreta) usuarioId=${id}`);
        throw new BadRequestException(UsuarioMessages.SENHA_ATUAL_INCORRETA);
      }
      if (dto.novaSenha === dto.senhaAtual) {
        throw new BadRequestException(UsuarioMessages.NOVA_SENHA_IGUAL);
      }
      user.senhaHash = await this.passwordHasher.hash(dto.novaSenha);
      alterados.push('senha');
    }

    if (dto.nome !== undefined && dto.nome !== user.nome) {
      user.nome = dto.nome;
      alterados.push('nome');
    }

    if (alterados.length === 0) {
      return user;
    }
    const saved = await this.save(user);
    this.logger.log(`Perfil atualizado usuarioId=${id} campos=${alterados.join(',')}`);
    return saved;
  }
}

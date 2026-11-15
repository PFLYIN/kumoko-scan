import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PasswordHasher } from '@kumoko/security';
import { normalizeCpf } from '../modules/users/domain/cpf';
import { maskEmail, normalizeEmail } from '../modules/users/domain/email';
import { UsersService } from '../modules/users/services/users.service';

export type ResultadoSeedAdmin = 'criado' | 'atualizado' | 'inalterado' | 'conflito' | 'falha';

/**
 * Garante o administrador definido em ADMIN_* no boot (idempotente).
 * - Nao existe: cria com role admin.
 * - Existe: garante role admin, sincroniza o CPF (se livre) e so regrava a senha
 *   quando ADMIN_PASSWORD nao confere com o hash atual.
 * Erros sao logados e nao derrubam o servico.
 */
@Injectable()
export class AdminSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: PasswordHasher,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<ResultadoSeedAdmin> {
    try {
      return await this.syncAdmin();
    } catch (error) {
      const detalhe = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha ao criar/atualizar o administrador erro=${detalhe}`);
      return 'falha';
    }
  }

  private async syncAdmin(): Promise<ResultadoSeedAdmin> {
    const nome = this.config.getOrThrow<string>('ADMIN_NAME').trim();
    const email = normalizeEmail(this.config.getOrThrow<string>('ADMIN_EMAIL'));
    const senha = this.config.getOrThrow<string>('ADMIN_PASSWORD');
    const rawCpf = this.config.getOrThrow<string>('ADMIN_CPF');
    const cpf = normalizeCpf(String(rawCpf)) ?? String(rawCpf);

    const existente = await this.usersService.findByEmail(email);
    if (!existente) {
      const donoDoCpf = await this.usersService.findByCpf(cpf);
      if (donoDoCpf) {
        this.logger.error(
          `ADMIN_CPF ja pertence a outro usuario usuarioId=${donoDoCpf.id}; administrador ${maskEmail(email)} nao foi criado. Ajuste ADMIN_CPF ou ADMIN_EMAIL.`,
        );
        return 'conflito';
      }
      const admin = await this.usersService.create({
        nome,
        email,
        cpf,
        senhaHash: await this.passwordHasher.hash(senha),
        role: 'admin',
      });
      this.logger.log(`Administrador criado usuarioId=${admin.id} email=${maskEmail(email)}`);
      return 'criado';
    }

    const alterados: string[] = [];
    if (existente.role !== 'admin') {
      existente.role = 'admin';
      alterados.push('role');
    }
    if (!(await this.passwordHasher.compare(senha, existente.senhaHash))) {
      existente.senhaHash = await this.passwordHasher.hash(senha);
      alterados.push('senha');
      this.logger.log(`Senha do administrador sincronizada usuarioId=${existente.id}`);
    }
    if (existente.cpf !== cpf) {
      const donoDoCpf = await this.usersService.findByCpf(cpf);
      if (donoDoCpf && donoDoCpf.id !== existente.id) {
        this.logger.error(
          `ADMIN_CPF ja pertence a outro usuario usuarioId=${donoDoCpf.id}; CPF do administrador usuarioId=${existente.id} mantido.`,
        );
      } else {
        existente.cpf = cpf;
        alterados.push('cpf');
      }
    }

    if (alterados.length === 0) {
      this.logger.log(`Administrador ja configurado usuarioId=${existente.id}`);
      return 'inalterado';
    }
    await this.usersService.save(existente);
    this.logger.log(`Administrador atualizado usuarioId=${existente.id} campos=${alterados.join(',')}`);
    return 'atualizado';
  }
}

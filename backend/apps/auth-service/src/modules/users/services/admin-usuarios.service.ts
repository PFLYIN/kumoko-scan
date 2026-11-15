import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Paginated, paginate, toSkipTake } from '@kumoko/common';
import type { UserRole } from '@kumoko/security';
import { Brackets, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { UsuarioMessages } from '../domain/usuario.messages';
import type { ListarUsuariosQueryDto, ResumoUsuariosResponseDto } from '../dto/admin-usuarios.dto';
import type { UsuarioResponseDto } from '../dto/usuario-response.dto';
import { User } from '../entities/user.entity';
import { toUsuarioResponse } from '../mappers/usuario.mapper';

const DIA_MS = 86_400_000;

/** Escapa curingas do LIKE (%, _ e \) para busca literal. */
export function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Casos de uso administrativos do contexto Identidade e Acesso. */
@Injectable()
export class AdminUsuariosService {
  private readonly logger = new Logger(AdminUsuariosService.name);

  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async listar(query: ListarUsuariosQueryDto): Promise<Paginated<UsuarioResponseDto>> {
    const qb = this.users.createQueryBuilder('u');
    if (query.busca) {
      const termo = `%${escaparLike(query.busca.toLowerCase())}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('LOWER(u.nome) LIKE :termo', { termo }).orWhere('u.email LIKE :termo', { termo });
        }),
      );
    }
    if (query.ids?.length) {
      qb.andWhere('u.id IN (:...ids)', { ids: query.ids });
    }
    if (query.role) {
      qb.andWhere('u.role = :role', { role: query.role });
    }
    if (query.ordenar === 'nome') {
      qb.orderBy('u.nome', 'ASC');
    } else if (query.ordenar === 'maior-gasto') {
      qb.orderBy('u.totalGasto', 'DESC');
    } else {
      qb.orderBy('u.criadoEm', 'DESC');
    }
    qb.addOrderBy('u.id', 'DESC');
    const { skip, take } = toSkipTake(query);
    const [usuarios, total] = await qb.skip(skip).take(take).getManyAndCount();
    return paginate(usuarios.map(toUsuarioResponse), total, query);
  }

  async resumo(agora: Date = new Date()): Promise<ResumoUsuariosResponseDto> {
    const [admins, clientes, novos, compradores] = await Promise.all([
      this.users.count({ where: { role: 'admin' } }),
      this.users.count({ where: { role: 'customer' } }),
      this.users.count({ where: { criadoEm: MoreThanOrEqual(new Date(agora.getTime() - 30 * DIA_MS)) } }),
      this.users.count({ where: { totalGasto: MoreThan(0) } }),
    ]);
    return { totalUsuarios: admins + clientes, clientes, admins, novosUltimos30Dias: novos, compradores };
  }

  /**
   * Promove/rebaixa um usuario. Regras: o admin nao altera o proprio papel e o
   * sistema nunca fica sem administrador (contagem feita na mesma transacao, com lock).
   */
  async alterarRole(alvoId: number, role: UserRole, atorId: number): Promise<UsuarioResponseDto> {
    if (alvoId === atorId) {
      throw new BadRequestException(UsuarioMessages.ROLE_PROPRIO);
    }
    const atualizado = await this.users.manager.transaction(async (manager) => {
      const repo = manager.getRepository(User);
      const alvo = await repo.findOne({ where: { id: alvoId }, lock: { mode: 'pessimistic_write' } });
      if (!alvo) {
        throw new NotFoundException(UsuarioMessages.USUARIO_NAO_ENCONTRADO);
      }
      if (alvo.role === role) {
        return alvo;
      }
      if (alvo.role === 'admin') {
        const admins = await repo
          .createQueryBuilder('u')
          .setLock('pessimistic_write')
          .where('u.role = :role', { role: 'admin' })
          .getCount();
        if (admins <= 1) {
          throw new ConflictException(UsuarioMessages.ULTIMO_ADMIN);
        }
      }
      alvo.role = role;
      return repo.save(alvo);
    });
    this.logger.log(`Papel alterado usuarioId=${alvoId} role=${role} por adminId=${atorId}`);
    return toUsuarioResponse(atualizado);
  }
}

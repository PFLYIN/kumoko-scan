import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { User } from '../entities/user.entity';
import { AdminUsuariosService, escaparLike } from './admin-usuarios.service';

function user(id: number, role: User['role']): User {
  return {
    id,
    nome: `U${id}`,
    email: `u${id}@x.com`,
    cpf: '52998224725',
    senhaHash: 'h',
    role,
    totalGasto: 0,
    criadoEm: new Date('2026-01-01T00:00:00Z'),
    atualizadoEm: new Date(),
  };
}

describe('AdminUsuariosService', () => {
  let inner: { findOne: jest.Mock; save: jest.Mock; createQueryBuilder: jest.Mock };
  let qb: { setLock: jest.Mock; where: jest.Mock; getCount: jest.Mock };
  let repo: { count: jest.Mock; manager: { transaction: jest.Mock } };
  let service: AdminUsuariosService;

  beforeEach(() => {
    qb = { setLock: jest.fn(), where: jest.fn(), getCount: jest.fn() };
    qb.setLock.mockReturnValue(qb);
    qb.where.mockReturnValue(qb);
    inner = {
      findOne: jest.fn(),
      save: jest.fn((u: User) => Promise.resolve(u)),
      createQueryBuilder: jest.fn(() => qb),
    };
    repo = {
      count: jest.fn(),
      manager: {
        transaction: jest.fn((fn: (m: unknown) => unknown) => fn({ getRepository: () => inner })),
      },
    };
    service = new AdminUsuariosService(repo as unknown as Repository<User>);
  });

  it('impede o admin de alterar o proprio papel', async () => {
    await expect(service.alterarRole(1, 'customer', 1)).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.manager.transaction).not.toHaveBeenCalled();
  });

  it('404 para usuario inexistente', async () => {
    inner.findOne.mockResolvedValue(null);
    await expect(service.alterarRole(9, 'admin', 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('promove cliente a admin', async () => {
    inner.findOne.mockResolvedValue(user(5, 'customer'));
    const res = await service.alterarRole(5, 'admin', 1);
    expect(res.role).toBe('admin');
    expect(inner.save).toHaveBeenCalled();
  });

  it('recusa rebaixar o ultimo administrador (409)', async () => {
    inner.findOne.mockResolvedValue(user(5, 'admin'));
    qb.getCount.mockResolvedValue(1);
    await expect(service.alterarRole(5, 'customer', 1)).rejects.toBeInstanceOf(ConflictException);
    expect(inner.save).not.toHaveBeenCalled();
  });

  it('rebaixa admin quando ha outros administradores', async () => {
    inner.findOne.mockResolvedValue(user(5, 'admin'));
    qb.getCount.mockResolvedValue(2);
    const res = await service.alterarRole(5, 'customer', 1);
    expect(res.role).toBe('customer');
  });

  it('nao grava quando o papel ja e o pedido', async () => {
    inner.findOne.mockResolvedValue(user(5, 'customer'));
    await service.alterarRole(5, 'customer', 1);
    expect(inner.save).not.toHaveBeenCalled();
  });

  it('resumo soma clientes e admins', async () => {
    repo.count.mockResolvedValueOnce(2).mockResolvedValueOnce(10).mockResolvedValueOnce(3).mockResolvedValueOnce(4);
    await expect(service.resumo()).resolves.toEqual({
      totalUsuarios: 12,
      clientes: 10,
      admins: 2,
      novosUltimos30Dias: 3,
      compradores: 4,
    });
  });

  it('escapa curingas do LIKE', () => {
    expect(escaparLike('a%b_c\\')).toBe('a\\%b\\_c\\\\');
  });
});

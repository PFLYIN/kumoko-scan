import type { ConfigService } from '@nestjs/config';
import type { User } from '../modules/users/entities/user.entity';
import type { UsersService } from '../modules/users/services/users.service';
import { AdminSeeder } from './admin.seeder';

const ENV: Record<string, string> = {
  ADMIN_NAME: 'Administrador Kumoko',
  ADMIN_EMAIL: 'Admin@Kumoko.local',
  ADMIN_PASSWORD: 'Admin@Kumoko2026',
  ADMIN_CPF: '529.982.247-25',
};

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    nome: 'Administrador Kumoko',
    email: 'admin@kumoko.local',
    cpf: '52998224725',
    senhaHash: 'hash-admin',
    role: 'admin',
    totalGasto: 0,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    ...overrides,
  };
}

describe('AdminSeeder', () => {
  let users: { findByEmail: jest.Mock; findByCpf: jest.Mock; create: jest.Mock; save: jest.Mock };
  let hasher: { hash: jest.Mock; compare: jest.Mock };
  let seeder: AdminSeeder;

  beforeEach(() => {
    users = {
      findByEmail: jest.fn(),
      findByCpf: jest.fn().mockResolvedValue(null),
      create: jest.fn((d: Partial<User>) => Promise.resolve(makeUser(d))),
      save: jest.fn((u: User) => Promise.resolve(u)),
    };
    hasher = { hash: jest.fn().mockResolvedValue('hash-novo'), compare: jest.fn().mockResolvedValue(true) };
    const config = { getOrThrow: jest.fn((k: string) => ENV[k]) } as unknown as ConfigService;
    seeder = new AdminSeeder(users as unknown as UsersService, hasher, config);
  });

  it('cria o admin quando nao existe (email/cpf normalizados)', async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(seeder.seed()).resolves.toBe('criado');
    expect(users.findByEmail).toHaveBeenCalledWith('admin@kumoko.local');
    expect(users.create).toHaveBeenCalledWith({
      nome: 'Administrador Kumoko',
      email: 'admin@kumoko.local',
      cpf: '52998224725',
      senhaHash: 'hash-novo',
      role: 'admin',
    });
  });

  it('idempotente: nada muda quando ja esta configurado', async () => {
    users.findByEmail.mockResolvedValue(makeUser());
    await expect(seeder.seed()).resolves.toBe('inalterado');
    expect(users.save).not.toHaveBeenCalled();
    expect(hasher.hash).not.toHaveBeenCalled();
  });

  it('promove a admin e sincroniza a senha quando nao confere', async () => {
    users.findByEmail.mockResolvedValue(makeUser({ role: 'customer' }));
    hasher.compare.mockResolvedValue(false);
    await expect(seeder.seed()).resolves.toBe('atualizado');
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin', senhaHash: 'hash-novo' }),
    );
  });

  it('nao cria quando ADMIN_CPF pertence a outro usuario', async () => {
    users.findByEmail.mockResolvedValue(null);
    users.findByCpf.mockResolvedValue(makeUser({ id: 50, email: 'outro@x.com', role: 'customer' }));
    await expect(seeder.seed()).resolves.toBe('conflito');
    expect(users.create).not.toHaveBeenCalled();
  });

  it('falha de banco nao derruba o boot', async () => {
    users.findByEmail.mockRejectedValue(new Error('db fora'));
    await expect(seeder.seed()).resolves.toBe('falha');
  });
});

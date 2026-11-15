import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { PasswordHasher } from '@kumoko/security';
import { QueryFailedError, type Repository } from 'typeorm';
import type { User } from '../entities/user.entity';
import { UsersService } from './users.service';

function makeUser(): User {
  return {
    id: 3,
    nome: 'Joao',
    email: 'joao@exemplo.com',
    cpf: '52998224725',
    senhaHash: 'hash-atual',
    role: 'customer',
    totalGasto: 10,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };
}

describe('UsersService', () => {
  let repo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let hasher: jest.Mocked<Pick<PasswordHasher, 'hash' | 'compare'>>;
  let service: UsersService;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn((u: User) => Promise.resolve(u)),
      create: jest.fn((u: User) => u),
    };
    hasher = { hash: jest.fn().mockResolvedValue('hash-novo'), compare: jest.fn() };
    service = new UsersService(repo as unknown as Repository<User>, hasher);
  });

  it('404 quando o usuario nao existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.getProfile(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('atualiza somente o nome', async () => {
    repo.findOne.mockResolvedValue(makeUser());
    const user = await service.updateProfile(3, { nome: 'Joao Silva' });
    expect(user.nome).toBe('Joao Silva');
    expect(hasher.compare).not.toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('nao grava quando nada mudou', async () => {
    repo.findOne.mockResolvedValue(makeUser());
    await service.updateProfile(3, { nome: 'Joao' });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('troca de senha exige senhaAtual', async () => {
    repo.findOne.mockResolvedValue(makeUser());
    await expect(service.updateProfile(3, { novaSenha: 'NovaSenha1' })).rejects.toThrow(
      new BadRequestException('Informe a senha atual para definir uma nova senha.'),
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('senhaAtual incorreta -> 400', async () => {
    repo.findOne.mockResolvedValue(makeUser());
    hasher.compare.mockResolvedValue(false);
    await expect(
      service.updateProfile(3, { senhaAtual: 'Errada123', novaSenha: 'NovaSenha1' }),
    ).rejects.toThrow(new BadRequestException('Senha atual incorreta.'));
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('troca a senha quando senhaAtual confere', async () => {
    repo.findOne.mockResolvedValue(makeUser());
    hasher.compare.mockResolvedValue(true);
    const user = await service.updateProfile(3, { senhaAtual: 'Atual1234', novaSenha: 'NovaSenha1' });
    expect(hasher.compare).toHaveBeenCalledWith('Atual1234', 'hash-atual');
    expect(hasher.hash).toHaveBeenCalledWith('NovaSenha1');
    expect(user.senhaHash).toBe('hash-novo');
  });

  it('traduz chave duplicada de e-mail em 409', async () => {
    const erro = new QueryFailedError('INSERT', [], {
      code: 'ER_DUP_ENTRY',
      errno: 1062,
      sqlMessage: 'Duplicate entry for key uq_usuarios_email',
    } as never);
    repo.save.mockRejectedValue(erro);
    await expect(
      service.create({ nome: 'A', email: 'a@a.com', cpf: '52998224725', senhaHash: 'h', role: 'customer' }),
    ).rejects.toThrow(new ConflictException('E-mail já cadastrado.'));
  });
});

import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { PasswordHasher } from '@kumoko/security';
import type { User } from '../../users/entities/user.entity';
import type { UsersService } from '../../users/services/users.service';
import type { UsuarioRegistradoPublisher } from '../events/usuario-registrado.publisher';
import { AuthService } from './auth.service';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 7,
    nome: 'Maria',
    email: 'maria@exemplo.com',
    cpf: '52998224725',
    senhaHash: 'hash-real',
    role: 'customer',
    totalGasto: 0,
    criadoEm: new Date('2026-11-14T12:00:00.000Z'),
    atualizadoEm: new Date('2026-11-14T12:00:00.000Z'),
    ...overrides,
  };
}

describe('AuthService', () => {
  let users: jest.Mocked<Pick<UsersService, 'findByEmail' | 'findByCpf' | 'create'>>;
  let hasher: jest.Mocked<Pick<PasswordHasher, 'hash' | 'compare'>>;
  let jwt: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let publisher: jest.Mocked<Pick<UsuarioRegistradoPublisher, 'publish'>>;
  let service: AuthService;

  beforeEach(() => {
    users = { findByEmail: jest.fn(), findByCpf: jest.fn(), create: jest.fn() };
    hasher = { hash: jest.fn().mockResolvedValue('hash-novo'), compare: jest.fn() };
    jwt = { signAsync: jest.fn().mockResolvedValue('jwt-token') };
    publisher = { publish: jest.fn().mockResolvedValue(undefined) };
    const config = { get: jest.fn().mockReturnValue('2h') } as unknown as ConfigService;
    service = new AuthService(
      users as unknown as UsersService,
      hasher,
      jwt as unknown as JwtService,
      publisher as unknown as UsuarioRegistradoPublisher,
      config,
    );
  });

  const registerDto = {
    nome: ' Maria ',
    email: ' Maria@Exemplo.COM ',
    cpf: '529.982.247-25',
    senha: 'Senha123',
  };

  describe('register', () => {
    it('cria sempre customer, normaliza email/cpf, faz hash e publica user.registered', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.findByCpf.mockResolvedValue(null);
      users.create.mockImplementation((data) => Promise.resolve(makeUser({ ...data, id: 10 })));

      // Mesmo que o cliente tente enviar role, o cadastro publico ignora.
      const user = await service.register({ ...registerDto, role: 'admin' } as never);

      expect(users.findByEmail).toHaveBeenCalledWith('maria@exemplo.com');
      expect(users.findByCpf).toHaveBeenCalledWith('52998224725');
      expect(users.create).toHaveBeenCalledWith({
        nome: 'Maria',
        email: 'maria@exemplo.com',
        cpf: '52998224725',
        senhaHash: 'hash-novo',
        role: 'customer',
      });
      expect(hasher.hash).toHaveBeenCalledWith('Senha123');
      expect(user.role).toBe('customer');
      expect(publisher.publish).toHaveBeenCalledWith(user);
    });

    it('409 quando o e-mail ja existe', async () => {
      users.findByEmail.mockResolvedValue(makeUser());
      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('E-mail já cadastrado.'),
      );
      expect(users.create).not.toHaveBeenCalled();
      expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('409 quando o CPF ja existe', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.findByCpf.mockResolvedValue(makeUser({ id: 99 }));
      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('CPF já vinculado a outra conta.'),
      );
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('gera token com payload do usuario e expiresIn em segundos', async () => {
      users.findByEmail.mockResolvedValue(makeUser());
      hasher.compare.mockResolvedValue(true);

      const result = await service.login({ email: 'MARIA@exemplo.com', senha: 'Senha123' });

      expect(hasher.compare).toHaveBeenCalledWith('Senha123', 'hash-real');
      expect(jwt.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: '7', email: 'maria@exemplo.com', nome: 'Maria', role: 'customer' }),
      );
      expect(result).toEqual({
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: 7200,
        usuario: {
          id: 7,
          nome: 'Maria',
          email: 'maria@exemplo.com',
          role: 'customer',
          totalGasto: 0,
          criadoEm: '2026-11-14T12:00:00.000Z',
        },
      });
    });

    it('401 generico para senha errada', async () => {
      users.findByEmail.mockResolvedValue(makeUser());
      hasher.compare.mockResolvedValue(false);
      await expect(service.login({ email: 'maria@exemplo.com', senha: 'errada123' })).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas.'),
      );
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });

    it('401 generico para e-mail inexistente, comparando contra hash dummy', async () => {
      users.findByEmail.mockResolvedValue(null);
      hasher.hash.mockResolvedValue('hash-dummy');
      hasher.compare.mockResolvedValue(false);
      await expect(service.login({ email: 'x@exemplo.com', senha: 'Senha123' })).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas.'),
      );
      expect(hasher.compare).toHaveBeenCalledWith('Senha123', 'hash-dummy');
    });
  });
});

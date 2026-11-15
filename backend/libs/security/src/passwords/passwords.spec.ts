import { PASSWORD_HASH_COST, PasswordHasher } from './password-hasher';
import { isStrongPassword } from './password-policy';

describe('PasswordHasher', () => {
  const hasher = new PasswordHasher();

  it('gera hash bcrypt com custo 12 e valida a senha correta', async () => {
    const hash = await hasher.hash('Senha123');
    expect(hash).toMatch(new RegExp(`^\\$2[aby]\\$${PASSWORD_HASH_COST}\\$`));
    expect(hash).not.toContain('Senha123');
    await expect(hasher.compare('Senha123', hash)).resolves.toBe(true);
  });

  it('rejeita senha incorreta', async () => {
    const hash = await hasher.hash('Senha123');
    await expect(hasher.compare('senha123', hash)).resolves.toBe(false);
  });
});

describe('isStrongPassword', () => {
  it.each(['Senha123', 'abcdefg1', '12345678a', 'Admin@Kumoko2026'])('aceita "%s"', (senha) => {
    expect(isStrongPassword(senha)).toBe(true);
  });

  it.each([
    ['curta', 'abc12'],
    ['so letras', 'abcdefgh'],
    ['so numeros', '12345678'],
    ['vazia', ''],
  ])('rejeita senha %s', (_caso, senha) => {
    expect(isStrongPassword(senha)).toBe(false);
  });

  it('rejeita valores que nao sao string', () => {
    expect(isStrongPassword(undefined)).toBe(false);
    expect(isStrongPassword(12345678)).toBe(false);
  });
});

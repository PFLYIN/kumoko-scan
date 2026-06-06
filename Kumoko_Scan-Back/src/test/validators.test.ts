import { isEmailValid, isCpfValid, isPasswordStrong } from '../utils/validators';

describe('Suíte de Testes Unitários - Regras de Negócio (Kumoko Scan)', () => {

  describe('Validações de E-mail', () => {
    test('1. Deve APROVAR um e-mail formatado corretamente', () => {
      expect(isEmailValid('admin@kumokoscan.com.br')).toBe(true);
    });

    test('2. Deve BLOQUEAR um e-mail sem o símbolo de arroba (@)', () => {
      expect(isEmailValid('adminkumokoscan.com')).toBe(false);
    });

    test('3. Deve BLOQUEAR um e-mail com espaços em branco', () => {
      expect(isEmailValid('admin @kumoko.com')).toBe(false);
    });
  });

  describe('Validações de Senha', () => {
    test('4. Deve APROVAR uma senha com 8 caracteres ou mais', () => {
      expect(isPasswordStrong('SenhaForte123!')).toBe(true);
    });

    test('5. Deve BLOQUEAR uma senha com menos de 8 caracteres', () => {
      expect(isPasswordStrong('1234567')).toBe(false);
    });
  });

  describe('Validações Matemáticas de CPF', () => {
    test('6. Deve APROVAR um CPF matemático real (com pontuação)', () => {
      expect(isCpfValid('529.982.247-25')).toBe(true);
    });

    test('7. Deve BLOQUEAR um CPF com todos os números repetidos', () => {
      expect(isCpfValid('11111111111')).toBe(false);
      expect(isCpfValid('00000000000')).toBe(false);
    });

    test('8. Deve BLOQUEAR um CPF com tamanho incorreto ou matemática errada', () => {
      expect(isCpfValid('123')).toBe(false); 
      expect(isCpfValid('12345678901')).toBe(false); 
    });
  });

});
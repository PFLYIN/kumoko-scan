import { expect, test } from '@playwright/test';
import { CUSTOMER_STATE, customerCredentials } from './support/env.js';
import { gerarCpf, RUN_ID } from './support/data.js';

// Login e cadastro tem throttle de 5/min por IP: em rodadas seguidas o backend pode responder 429.
// Reenvia o formulario ate obter o resultado esperado.
async function enviarComThrottle(page, botao, esperado) {
  const throttle = page.getByText('Muitas requisições').first();
  for (let i = 0; i < 10; i += 1) {
    await botao.click();
    await expect(esperado.or(throttle)).toBeVisible({ timeout: 15_000 });
    if (await esperado.isVisible()) return;
    await expect(throttle).toBeHidden({ timeout: 15_000 });
    await page.waitForTimeout(10_000);
  }
  throw new Error('throttle de autenticacao nao liberou');
}

// Cadastro com validacoes, login e logout pela interface (visitante).
test.describe('cadastro e login', () => {
  test('cadastro valida CPF, senha forte e confirmacao; depois cria a conta e entra', async ({ page }, info) => {
    test.setTimeout(240_000);
    const sufixo = `${RUN_ID}${info.project.name.slice(-4)}`;
    const email = `cadastro.${sufixo}@kumoko.test`;
    const senha = 'Kumoko2026ok';

    await page.goto('/');
    await page.getByRole('link', { name: 'Entrar' }).click();
    await page.getByRole('tab', { name: 'Cadastrar' }).click();
    await expect(page).toHaveURL(/modo=cadastro/);

    await page.getByLabel('Nome completo').fill('Jo');
    await page.getByLabel('E-mail').fill('email-invalido');
    await page.getByLabel('CPF').fill('111.111.111-11');
    await page.getByLabel('Senha', { exact: true }).fill('fraca');
    await page.getByLabel('Confirmar senha').fill('outra');
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(page.getByText('Informe seu nome completo')).toBeVisible();
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();
    await expect(page.getByText('CPF inválido. Confira os dígitos.')).toBeVisible();
    await expect(page.getByText('Mínimo de 8 caracteres, com pelo menos uma letra e um número.')).toBeVisible();
    await expect(page.getByText('As senhas não coincidem.')).toBeVisible();
    await expect(page.getByLabel('CPF')).toHaveAttribute('aria-invalid', 'true');

    // Senha so com letras continua fraca.
    await page.getByLabel('Senha', { exact: true }).fill('somenteletras');
    await page.getByLabel('Confirmar senha').fill('somenteletras');
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('aria-invalid', 'true');

    const cpf = gerarCpf();
    await page.getByLabel('Nome completo').fill(`Leitora ${sufixo}`);
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('CPF').fill(cpf);
    await expect(page.getByLabel('CPF')).toHaveValue(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    await page.getByLabel('Senha', { exact: true }).fill(senha);
    await page.getByLabel('Confirmar senha').fill(senha);
    await enviarComThrottle(page, page.getByRole('button', { name: 'Criar conta' }), page.getByText('Conta criada com sucesso'));
    await expect(page.getByRole('tab', { name: 'Entrar' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('E-mail')).toHaveValue(email);

    // Senha errada -> mensagem generica; senha certa -> logado.
    const entrar = page.getByRole('button', { name: 'Entrar', exact: true });
    await page.getByLabel('Senha').fill('Errada2026x');
    await enviarComThrottle(page, entrar, page.getByText('Credenciais inválidas.').first());
    await page.getByLabel('Senha').fill(senha);
    const menu = page.getByRole('button', { name: /Menu da conta de Leitora/ });
    await enviarComThrottle(page, entrar, menu);
    await expect(page).toHaveURL(/\/$/);

    // Cadastro duplicado (mesmo e-mail) e recusado pelo backend.
    const dup = await page.request.post('/api/auth/register', {
      data: { nome: 'Duplicado', email, cpf: gerarCpf(), senha },
    });
    expect([409, 429]).toContain(dup.status());

    // Cliente comum nao ve o menu de admin.
    await menu.click();
    await expect(page.getByRole('menuitem', { name: 'Painel admin' })).toHaveCount(0);
    await page.getByRole('menuitem', { name: 'Sair' }).click();
    await expect(page.getByText('Você saiu da sua conta.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible();
    await page.goto('/perfil');
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil/);
  });
});

test.describe('perfil do cliente', () => {
  test.use({ storageState: CUSTOMER_STATE });

  test('altera o nome e troca a senha exigindo a senha atual', async ({ page }, info) => {
    const cliente = customerCredentials();
    const novoNome = `Cliente Renomeado ${info.project.name.slice(-4)}`;
    const novaSenha = `Troca${Date.now().toString(36)}9`;

    await page.goto('/perfil');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Total investido')).toBeVisible();

    await page.getByLabel('Nome', { exact: true }).fill(novoNome);
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(novoNome);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(novoNome);

    const senha = page.getByRole('region', { name: 'Alterar senha' });
    await senha.getByLabel('Senha atual').fill('SenhaErrada123');
    await senha.getByLabel('Nova senha', { exact: true }).fill(novaSenha);
    await senha.getByLabel('Confirmar nova senha').fill(novaSenha);
    await senha.getByRole('button', { name: 'Alterar senha' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /senha atual/i })).toBeVisible();

    await senha.getByLabel('Senha atual').fill(cliente.senha);
    await senha.getByLabel('Nova senha', { exact: true }).fill(novaSenha);
    await senha.getByLabel('Confirmar nova senha').fill('diferente123');
    await senha.getByRole('button', { name: 'Alterar senha' }).click();
    await expect(senha.getByText(/não coincidem/)).toBeVisible();

    await senha.getByLabel('Confirmar nova senha').fill(novaSenha);
    await senha.getByRole('button', { name: 'Alterar senha' }).click();
    await expect(page.getByText(/Senha alterada/i).first()).toBeVisible();

    // Volta a senha original para manter o cliente compartilhado utilizavel.
    const res = await page.request.patch('/api/users/me', { data: { senhaAtual: novaSenha, novaSenha: cliente.senha } });
    expect(res.status()).toBe(200);
  });
});

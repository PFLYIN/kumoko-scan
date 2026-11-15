import { expect, test } from '@playwright/test';
import { ADMIN_STATE, CUSTOMER_STATE, BASE_URL, customerCredentials } from './support/env.js';
import { adminApi, uniq } from './support/data.js';
import { request } from '@playwright/test';

// Painel administrativo: dashboard, pedidos, usuarios (promover/rebaixar) e protecao das rotas admin.
test.use({ storageState: ADMIN_STATE });

const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v).replace(/\s/g, ' ');
const norm = (t) => t.replace(/\s/g, ' ');

test('painel: KPIs batem com a API, grafico e pedidos recentes; sidebar navega', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Painel', level: 1 })).toBeVisible();
  const resumo = await (await page.request.get('/api/pedidos/admin/resumo?dias=30')).json();
  const usuarios = await (await page.request.get('/api/users/admin/resumo')).json();

  const kpi = (nome) => page.getByRole('group', { name: nome }).getByTestId('kpi-valor');
  // Pode haver vendas entre as chamadas: compara com tolerancia a crescimento.
  expect(norm(await kpi('Receita total').innerText())).toBe(brl(resumo.receitaTotal));
  expect(Number(await kpi('Pedidos').innerText())).toBeGreaterThanOrEqual(resumo.totalPedidos);
  expect(norm(await kpi('Ticket médio').innerText())).toBe(brl(resumo.ticketMedio));
  expect(Number(await kpi('Clientes').innerText())).toBe(usuarios.clientes);
  expect(resumo.vendasPorDia).toHaveLength(30);

  if (resumo.pedidosPeriodo > 0) {
    await expect(page.getByRole('img', { name: 'Receita por dia' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Obras mais vendidas' }).getByRole('listitem').first()).toContainText(
      resumo.topObras[0].nome,
    );
    await expect(page.getByRole('cell', { name: `#${resumo.pedidosRecentes[0].id}`, exact: true })).toBeVisible();
  }

  const nav = page.getByRole('navigation', { name: 'Administração', exact: true });
  await nav.getByRole('link', { name: 'Acervo' }).click();
  await expect(page.getByRole('heading', { name: 'Gerenciar acervo' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Trilha de navegação' })).toContainText('Acervo');
  await nav.getByRole('link', { name: 'Pedidos' }).click();
  await expect(page.getByRole('heading', { name: 'Pedidos', level: 1 })).toBeVisible();
  await nav.getByRole('link', { name: 'Usuários' }).click();
  await expect(page.getByRole('heading', { name: 'Usuários', level: 1 })).toBeVisible();
  await nav.getByRole('link', { name: 'Painel' }).click();
  await expect(page).toHaveURL(/\/admin$/);
});

test('pedidos: lista, detalhe com itens, filtro por cliente e status', async ({ page }) => {
  const lista = await (await page.request.get('/api/pedidos/admin?limit=1')).json();
  test.skip(lista.meta.total === 0, 'sem pedidos na base');
  const pedido = lista.data[0];

  await page.goto('/admin/pedidos');
  await expect(page.getByText(`${lista.meta.total} pedido(s) encontrado(s)`)).toBeVisible();
  await page.getByRole('button', { name: `Detalhes do pedido #${pedido.id}` }).click();
  const itens = page.getByRole('list', { name: `Itens do pedido #${pedido.id}` });
  await expect(itens.getByRole('listitem')).toHaveCount(pedido.itens.length);
  await expect(itens).toContainText(pedido.itens[0].nome);

  await page.getByRole('row', { name: new RegExp(`#${pedido.id}\\b`) }).getByTitle('Filtrar pedidos deste cliente').click();
  await expect(page).toHaveURL(new RegExp(`usuarioId=${pedido.usuarioId}`));
  const doCliente = await (await page.request.get(`/api/pedidos/admin?usuarioId=${pedido.usuarioId}&limit=1`)).json();
  await expect(page.getByText(`${doCliente.meta.total} pedido(s) encontrado(s)`)).toBeVisible();
  await page.getByRole('button', { name: 'Remover filtro de cliente' }).click();
  await expect(page).not.toHaveURL(/usuarioId=/);

  await page.getByLabel('Status').selectOption('CANCELADO');
  await expect(page).toHaveURL(/status=CANCELADO/);
  const cancelados = await (await page.request.get('/api/pedidos/admin?status=CANCELADO&limit=1')).json();
  if (cancelados.meta.total === 0) await expect(page.getByText('Nenhum pedido encontrado')).toBeVisible();
});

test('usuarios: busca, promove e rebaixa com confirmacao; nao altera o proprio papel', async ({ page }) => {
  const cliente = customerCredentials();
  await page.goto('/admin/usuarios');
  await page.getByRole('searchbox', { name: 'Buscar usuários' }).fill(cliente.email);
  await page.getByRole('searchbox', { name: 'Buscar usuários' }).press('Enter');
  const linhas = page.locator('tbody tr');
  await expect(linhas).toHaveCount(1);
  await expect(linhas.first()).toContainText(cliente.email);
  await expect(linhas.first()).toContainText('Cliente');

  await linhas.first().getByRole('button', { name: /^Promover / }).click();
  const dialogo = page.getByRole('dialog');
  await expect(dialogo).toContainText('Promover a administrador?');
  await dialogo.getByRole('button', { name: 'Promover' }).click();
  await expect(page.getByText(/agora é administrador/)).toBeVisible();
  await expect(linhas.first()).toContainText('Admin');

  await linhas.first().getByRole('button', { name: /^Rebaixar / }).click();
  await expect(dialogo).toContainText('Remover acesso de administrador?');
  await dialogo.getByRole('button', { name: 'Rebaixar' }).click();
  await expect(page.getByText(/agora é cliente/)).toBeVisible();

  const { data } = await (await page.request.get('/api/users/admin', { params: { busca: cliente.email } })).json();
  expect(data[0].role).toBe('customer');

  // O proprio admin: botao desabilitado e API recusa (400).
  await page.goto('/admin/usuarios?role=admin');
  const eu = page.locator('tbody tr', { hasText: '(você)' });
  await expect(eu.getByRole('button', { name: /^Rebaixar / })).toBeDisabled();
  const me = await (await page.request.get('/api/users/me')).json();
  const res = await page.request.patch(`/api/users/${me.id}/role`, { data: { role: 'customer' } });
  expect(res.status()).toBe(400);
});

test('form de obra: validacao em tempo real e generos como tags (quando a API suporta)', async ({ page }) => {
  await page.goto('/admin/obras/nova');
  await page.getByLabel('Preço (R$)').fill('-1');
  await page.getByLabel('Nome').focus();
  await expect(page.getByText(/Informe um preço válido/)).toBeVisible();
  await page.getByLabel('Preço (R$)').fill('12.5');
  await page.getByLabel('Nome').focus();
  await expect(page.getByText(/Informe um preço válido/)).toHaveCount(0);

  const amostra = await (await page.request.get('/api/obras?limit=1')).json();
  const suporta = Array.isArray(amostra.data[0]?.generos);
  test.skip(!suporta, 'catalog-service ainda sem o campo generos');

  const api = await adminApi();
  const nome = uniq('Generos');
  try {
    await page.getByLabel('Tipo').selectOption('livro');
    await page.getByLabel('Nome').fill(nome);
    const generos = page.getByRole('textbox', { name: 'Gêneros' });
    await generos.fill('Drama');
    await generos.press('Enter');
    await generos.pressSequentially('Clássico,');
    await expect(page.getByRole('button', { name: 'Remover gênero Drama' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remover gênero Clássico' })).toBeVisible();
    await page.getByRole('button', { name: 'Cadastrar obra' }).click();
    await expect(page.getByText(`"${nome}" cadastrada no acervo.`)).toBeVisible();
    const { data } = await (await page.request.get('/api/obras', { params: { busca: nome } })).json();
    expect(data[0].generos).toEqual(expect.arrayContaining(['Drama', 'Clássico']));

    // Edicao remove um genero.
    await page.goto(`/admin/obras/${data[0].id}/editar`);
    await page.getByRole('button', { name: 'Remover gênero Drama' }).click();
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Obra atualizada.')).toBeVisible();
    const editada = await (await page.request.get(`/api/obras/${data[0].id}`)).json();
    expect(editada.generos).toEqual(['Clássico']);
  } finally {
    const { data } = await (await api.get('/api/obras', { params: { busca: nome } })).json();
    for (const o of data) await api.delete(`/api/obras/${o.id}`);
    await api.dispose();
  }
});

test('rotas admin: cliente recebe 403 na API e tela de acesso restrito', async ({ browser }) => {
  const ctx = await request.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: true, storageState: CUSTOMER_STATE });
  for (const url of ['/api/pedidos/admin/resumo', '/api/pedidos/admin', '/api/users/admin', '/api/users/admin/resumo']) {
    expect((await ctx.get(url)).status(), url).toBe(403);
  }
  expect((await ctx.patch('/api/users/1/role', { data: { role: 'customer' } })).status()).toBe(403);
  await ctx.dispose();

  const context = await browser.newContext({ storageState: CUSTOMER_STATE, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/admin/pedidos`);
  await expect(page.getByText('Acesso restrito')).toBeVisible();
  await context.close();
});

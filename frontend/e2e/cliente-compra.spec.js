import { expect, test } from '@playwright/test';
import { CUSTOMER_STATE } from './support/env.js';
import { adminApi, criarObra, excluirObra, uniq } from './support/data.js';

// Cliente logado: carrinho com os 3 tipos, quantidades, remocao, comprar agora, checkout,
// historico, detalhe do pedido e total gasto no perfil.
test.use({ storageState: CUSTOMER_STATE });

const obras = {};
let api;

test.beforeAll(async () => {
  api = await adminApi();
  obras.manga = await criarObra(api, { tipo: 'manga', nome: uniq('Manga Compra'), preco: 10.5, volume: 1 });
  obras.livro = await criarObra(api, { tipo: 'livro', nome: uniq('Livro Compra'), preco: 20 });
  obras.novel = await criarObra(api, { tipo: 'novel', nome: uniq('Novel Compra'), preco: 7.25, volume: 2 });
  obras.extra = await criarObra(api, { tipo: 'manga', nome: uniq('Manga Removido'), preco: 99 });
});

test.afterAll(async () => {
  for (const obra of Object.values(obras)) await excluirObra(api, obra.id);
  await api.dispose();
});

const carrinhoBadge = (page) => page.getByRole('link', { name: /^Carrinho com/ });

test('carrinho com manga, livro e novel: quantidades, remocao e finalizacao', async ({ page }) => {
  const perfilAntes = await (await page.request.get('/api/users/me')).json();

  await page.goto(`/obras/${obras.manga.id}`);
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
  await expect(page.getByText(`"${obras.manga.nome}" adicionado ao carrinho.`)).toBeVisible();
  await expect(carrinhoBadge(page)).toHaveAccessibleName('Carrinho com 2 itens');

  await page.goto(`/obras/${obras.livro.id}`);
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
  await page.goto(`/obras/${obras.extra.id}`);
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
  await page.goto(`/obras/${obras.novel.id}`);
  await page.getByRole('button', { name: 'Comprar agora' }).click();
  await expect(page).toHaveURL(/\/carrinho$/);

  const itens = page.getByRole('list', { name: 'Itens do carrinho' });
  await expect(itens.getByRole('listitem')).toHaveCount(4);
  await expect(page.getByText('5 itens no carrinho')).toBeVisible();

  // Remove o extra e ajusta quantidades.
  await page.getByRole('button', { name: `Remover ${obras.extra.nome} do carrinho` }).click();
  await expect(itens.getByRole('listitem')).toHaveCount(3);
  const livro = itens.getByRole('listitem').filter({ hasText: obras.livro.nome });
  await livro.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await livro.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await expect(livro.getByRole('group')).toContainText('3');
  await livro.getByRole('button', { name: 'Diminuir quantidade' }).click();
  await expect(livro.getByRole('group')).toContainText('2');
  // manga 2 x 10,50 + livro 2 x 20,00 + novel 1 x 7,25 = 68,25
  await expect(page.getByText('R$ 68,25').first()).toBeVisible();

  await page.getByRole('button', { name: 'Finalizar compra' }).click();
  await expect(page).toHaveURL(/\/pedidos\?novo=\d+/);
  const pedidoId = new URL(page.url()).searchParams.get('novo');
  await expect(page.getByText(/Pedido #\d+ concluído! Total: R\$\s68,25/)).toBeVisible();
  await expect(carrinhoBadge(page)).toHaveAccessibleName('Carrinho com 0 itens');

  const card = page.getByRole('article', { name: new RegExp(`Pedido #${pedidoId}`) });
  await expect(card).toContainText('recém-criado');
  await expect(card).toContainText('R$ 68,25');
  await expect(card).toContainText(obras.livro.nome);
  await expect(card).toContainText(obras.novel.nome);
  await expect(card).toContainText(obras.manga.nome);
  await expect(card).toContainText('Concluído');

  await card.getByRole('link', { name: `Ver detalhes do pedido ${pedidoId}` }).click();
  await expect(page).toHaveURL(new RegExp(`/pedidos/${pedidoId}$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Pedido #${pedidoId}`);
  await expect(page.getByText('5 unidades em 3 obras')).toBeVisible();
  await expect(page.getByText('2 x R$ 20,00')).toBeVisible();

  // Total gasto e atualizado de forma assincrona (evento order.completed).
  await expect
    .poll(async () => (await (await page.request.get('/api/users/me')).json()).totalGasto, { timeout: 15_000 })
    .toBeCloseTo(perfilAntes.totalGasto + 68.25, 2);
  await page.goto('/perfil');
  const esperado = (perfilAntes.totalGasto + 68.25).toFixed(2).replace('.', ',');
  const totalInvestido = page.locator('dl > div').filter({ hasText: 'Total investido' }).locator('dd');
  await expect(totalInvestido).toContainText(esperado);
});

test('pedido de outro usuario ou inexistente mostra "nao encontrado"', async ({ page }) => {
  await page.goto('/pedidos/999999999');
  await expect(page.getByText('Pedido não encontrado')).toBeVisible();
  await page.getByRole('link', { name: 'Meus pedidos' }).first().click();
  await expect(page).toHaveURL(/\/pedidos$/);
});

test('obra removida do catalogo fica indisponivel no carrinho e bloqueia a finalizacao', async ({ page }) => {
  const temp = await criarObra(api, { tipo: 'livro', nome: uniq('Livro Temporario'), preco: 5 });
  await page.goto(`/obras/${temp.id}`);
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
  await excluirObra(api, temp.id);
  await page.goto('/carrinho');
  await expect(page.getByText('Indisponível: removida do catálogo')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Finalizar compra' })).toBeDisabled();
  await page.getByRole('button', { name: `Remover ${temp.nome} do carrinho` }).click();
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible();
});

test('cliente nao acessa o painel administrativo', async ({ page }) => {
  await page.goto('/admin/acervo');
  await expect(page.getByText('Acesso restrito')).toBeVisible();
  await page.goto('/admin/obras/nova');
  await expect(page.getByText('Acesso restrito')).toBeVisible();
  await page.goto(`/obras/${obras.manga.id}`);
  await expect(page.getByRole('link', { name: 'Editar obra' })).toHaveCount(0);
  // O backend tambem recusa.
  const res = await page.request.delete(`/api/obras/${obras.manga.id}`);
  expect(res.status()).toBe(403);
});

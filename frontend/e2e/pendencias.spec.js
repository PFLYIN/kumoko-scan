import fs from 'node:fs';
import { expect, request, test } from '@playwright/test';
import { ADMIN_STATE, BASE_URL, CUSTOMER_STATE } from './support/env.js';
import { adminApi, coverFile, criarCapituloComPaginas, criarObra, excluirObra, uniq } from './support/data.js';

// Pendencias resolvidas: reordenar paginas, totalCapitulos no acervo, confirmacao/sucesso do checkout
// e progresso/retry no upload de paginas.

let api;
const obras = [];

test.beforeAll(async () => {
  api = await adminApi();
});

test.afterAll(async () => {
  for (const obra of obras) await excluirObra(api, obra.id);
  await api.dispose();
});

async function novaObra(dados) {
  const obra = await criarObra(api, dados);
  obras.push(obra);
  return obra;
}

const listarPaginas = async (capituloId) => (await api.get(`/api/capitulos/${capituloId}/paginas`)).json();

test.describe('admin', () => {
  test.use({ storageState: ADMIN_STATE });

  test('API: PUT /capitulos/:id/paginas/ordem reordena, valida e invalida o cache', async () => {
    const obra = await novaObra({ tipo: 'manga', nome: uniq('Manga Ordem API') });
    const cap = await criarCapituloComPaginas(api, obra.id, { paginas: 3 });
    const antes = await listarPaginas(cap.id); // aquece o cache
    const ids = antes.map((p) => p.id);
    const novaOrdem = [ids[2], ids[0], ids[1]];

    const res = await api.put(`/api/capitulos/${cap.id}/paginas/ordem`, { data: { paginaIds: novaOrdem } });
    expect(res.status()).toBe(200);
    const corpo = await res.json();
    expect(corpo.map((p) => [p.id, p.numero])).toEqual([
      [novaOrdem[0], 1],
      [novaOrdem[1], 2],
      [novaOrdem[2], 3],
    ]);
    const depois = await api.get(`/api/capitulos/${cap.id}/paginas`);
    expect(depois.headers()['x-cache']).toBe('MISS');
    expect((await depois.json()).map((p) => p.id)).toEqual(novaOrdem);

    // Lista incompleta, com repeticao ou com id estranho: 400.
    for (const paginaIds of [[ids[0], ids[1]], [ids[0], ids[0], ids[1]], [ids[0], ids[1], 999999999], []]) {
      const r = await api.put(`/api/capitulos/${cap.id}/paginas/ordem`, { data: { paginaIds } });
      expect(r.status()).toBe(400);
    }
    expect((await api.put('/api/capitulos/999999999/paginas/ordem', { data: { paginaIds: [1] } })).status()).toBe(404);
    // Sem autenticacao: 401.
    const anon = await request.newContext({
      baseURL: BASE_URL,
      ignoreHTTPSErrors: true,
      storageState: { cookies: [], origins: [] },
    });
    expect((await anon.put(`/api/capitulos/${cap.id}/paginas/ordem`, { data: { paginaIds: ids } })).status()).toBe(401);
    await anon.dispose();
  });

  test('admin reordena paginas (setas e arrastar), salva e o leitor reflete a nova ordem', async ({ page }) => {
    const obra = await novaObra({ tipo: 'manga', nome: uniq('Manga Ordem UI') });
    const cap = await criarCapituloComPaginas(api, obra.id, { paginas: 3 });
    const originais = await listarPaginas(cap.id);

    await page.goto(`/admin/obras/${obra.id}/capitulos`);
    const item = page.locator('main ul > li.panel').first();
    await item.getByRole('button', { name: /Páginas/ }).click();
    const grade = item.getByRole('list', { name: 'Ordem das páginas' });
    await expect(grade.getByRole('listitem')).toHaveCount(3);
    await expect(item.getByRole('button', { name: 'Salvar ordem' })).toHaveCount(0);
    await expect(item.getByRole('button', { name: 'Mover página 1 para cima' })).toBeDisabled();

    // Teclado/botoes: pagina 1 desce uma posicao -> [2, 1, 3]
    await item.getByRole('button', { name: 'Mover página 1 para baixo' }).focus();
    await page.keyboard.press('Enter');
    await expect(item.getByText('Ordem alterada (não salva)')).toBeVisible();
    await expect(grade.getByRole('img').first()).toHaveAttribute('alt', 'Página 2');

    // Desfazer restaura a ordem original.
    await item.getByRole('button', { name: 'Desfazer' }).click();
    await expect(grade.getByRole('img').first()).toHaveAttribute('alt', 'Página 1');

    // Arrastar e soltar (HTML5 DnD): pagina 3 para a primeira posicao -> [3, 1, 2]
    await grade.locator(`li[data-pagina-id="${originais[2].id}"]`).dragTo(grade.getByRole('listitem').first());
    await expect
      .poll(async () => grade.getByRole('img').evaluateAll((imgs) => imgs.map((i) => i.alt)))
      .toEqual(['Página 3', 'Página 1', 'Página 2']);

    await item.getByRole('button', { name: 'Salvar ordem' }).click();
    await expect(page.getByText('Ordem das páginas salva.').first()).toBeVisible();
    await expect(item.getByRole('button', { name: 'Salvar ordem' })).toHaveCount(0);
    // Renumeradas 1..N na nova ordem.
    await expect
      .poll(async () => grade.getByRole('img').evaluateAll((imgs) => imgs.map((i) => i.alt)))
      .toEqual(['Página 1', 'Página 2', 'Página 3']);

    const esperado = [originais[2].id, originais[0].id, originais[1].id];
    expect((await listarPaginas(cap.id)).map((p) => p.id)).toEqual(esperado);

    // Leitor publico na nova ordem.
    await page.goto(`/obras/${obra.id}/capitulos/${cap.id}`);
    const imgs = page.getByRole('list', { name: 'Páginas do capítulo' }).getByRole('img');
    await expect(imgs).toHaveCount(3);
    const srcs = await imgs.evaluateAll((list) => list.map((i) => i.getAttribute('src')));
    const porId = new Map(originais.map((p) => [p.id, p]));
    esperado.forEach((id, i) => {
      const p = porId.get(id);
      expect([p.imagemOtimizadaUrl, p.imagemUrl].some((u) => srcs[i].endsWith(u))).toBe(true);
    });
  });

  test('totalCapitulos na API e coluna "Capítulos" no acervo', async ({ page }) => {
    const manga = await novaObra({ tipo: 'manga', nome: uniq('Manga Contador') });
    const livro = await novaObra({ tipo: 'livro', nome: uniq('Livro Contador') });
    expect((await (await api.get(`/api/obras/${manga.id}`)).json()).totalCapitulos).toBe(0);
    await criarCapituloComPaginas(api, manga.id, { numero: 1, paginas: 0 });
    await criarCapituloComPaginas(api, manga.id, { numero: 2, paginas: 0 });
    // A criacao de capitulos invalida o cache das obras.
    expect((await (await api.get(`/api/obras/${manga.id}`)).json()).totalCapitulos).toBe(2);
    expect((await (await api.get(`/api/obras/${livro.id}`)).json()).totalCapitulos).toBe(0);

    await page.goto(`/admin/acervo?busca=${encodeURIComponent(manga.nome)}`);
    await expect(page.getByRole('columnheader', { name: 'Capítulos' })).toBeVisible();
    const linha = page.locator('tbody tr').filter({ hasText: manga.nome });
    await expect(linha.getByTestId('total-capitulos')).toHaveText('2');

    await page.goto(`/admin/acervo?busca=${encodeURIComponent(livro.nome)}`);
    await expect(page.locator('tbody tr').filter({ hasText: livro.nome }).getByTestId('total-capitulos')).toHaveText('—');
  });

  test('upload de paginas: progresso e status por arquivo, retry dos que falharam', async ({ page }) => {
    const obra = await novaObra({ tipo: 'novel', nome: uniq('Novel Upload') });
    const cap = await criarCapituloComPaginas(api, obra.id, { paginas: 0 });

    // Falha forcada no 2o envio (uma vez so).
    let chamadas = 0;
    await page.route(`**/api/capitulos/${cap.id}/paginas`, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      chamadas += 1;
      if (chamadas === 2) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ statusCode: 500, message: 'Falha simulada no envio.' }),
        });
      }
      return route.fallback();
    });

    await page.goto(`/admin/obras/${obra.id}/capitulos`);
    const item = page.locator('main ul > li.panel').first();
    await item.getByRole('button', { name: /Páginas/ }).click();
    const arquivos = [1, 2, 3].map((i) => ({
      name: `${String(i).padStart(3, '0')}.jpg`,
      mimeType: 'image/jpeg',
      buffer: fs.readFileSync(coverFile(i)),
    }));
    await item.locator('input[type="file"]').setInputFiles(arquivos);

    const envios = item.getByRole('region', { name: 'Envio de páginas' });
    await expect(envios.getByRole('listitem')).toHaveCount(3);
    await expect(envios).toContainText('2 de 3 enviada(s)');
    await expect(envios).toContainText('1 com erro');
    const falhou = envios.locator('li[data-status="erro"]');
    await expect(falhou).toHaveCount(1);
    await expect(falhou).toContainText('002.jpg');
    await expect(falhou).toContainText('Falha simulada no envio.');
    await expect(envios.locator('li[data-status="ok"]')).toHaveCount(2);
    await expect(envios.getByRole('progressbar', { name: 'Progresso de 001.jpg' })).toHaveAttribute('aria-valuenow', '100');
    await expect(page.getByText(/2 página\(s\) enviada\(s\), 1 com erro/)).toBeVisible();
    await expect(item.getByRole('img', { name: /^Página \d$/ })).toHaveCount(2);

    await envios.getByRole('button', { name: /Tentar novamente/ }).click();
    await expect(envios.locator('li[data-status="ok"]')).toHaveCount(3);
    await expect(envios).toContainText('3 de 3 enviada(s)');
    await expect(envios.getByRole('button', { name: /Tentar novamente/ })).toHaveCount(0);
    await expect(item.getByRole('img', { name: /^Página \d$/ })).toHaveCount(3);
    await expect(item).toContainText('3 página(s)');
    expect(await listarPaginas(cap.id)).toHaveLength(3);

    await envios.getByRole('button', { name: 'Fechar lista de envios' }).click();
    await expect(envios).toHaveCount(0);
  });
});

test.describe('cliente', () => {
  test.use({ storageState: CUSTOMER_STATE });

  test('checkout: modal de confirmacao com resumo, cancelar mantem o carrinho e tela de sucesso', async ({ page }) => {
    const a = await novaObra({ tipo: 'livro', nome: uniq('Livro Checkout'), preco: 12.5 });
    const b = await novaObra({ tipo: 'manga', nome: uniq('Manga Checkout'), preco: 8 });

    await page.goto(`/obras/${a.id}`);
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page.goto(`/obras/${b.id}`);
    await page.getByRole('button', { name: 'Comprar agora' }).click();
    await expect(page).toHaveURL(/\/carrinho$/);

    // Abre o modal e volta: nada e criado.
    await page.getByRole('button', { name: 'Finalizar compra' }).click();
    const dialog = page.getByRole('dialog', { name: 'Confirmar pedido' });
    await expect(dialog).toBeVisible();
    const itens = dialog.getByRole('list', { name: 'Itens do pedido' }).getByRole('listitem');
    await expect(itens).toHaveCount(2);
    await expect(itens.filter({ hasText: a.nome })).toContainText(/2 x R\$\s12,50/);
    await expect(itens.filter({ hasText: b.nome })).toContainText(/1 x R\$\s8,00/);
    await expect(dialog.getByTestId('confirmar-total')).toHaveText(/R\$\s33,00/);
    await expect(dialog).toContainText('preço final é confirmado pelo catálogo');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/carrinho$/);
    await expect(page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('listitem')).toHaveCount(2);

    // Confirma: um unico POST com Idempotency-Key.
    const posts = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().endsWith('/api/pedidos')) posts.push(req.headers()['idempotency-key']);
    });
    await page.getByRole('button', { name: 'Finalizar compra' }).click();
    await dialog.getByRole('button', { name: 'Confirmar pedido' }).click();
    await expect(page).toHaveURL(/\/pedidos\/\d+\/sucesso$/);
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatch(/^[0-9a-f-]{36}$/i);

    const pedidoId = page.url().match(/\/pedidos\/(\d+)\/sucesso/)[1];
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Pedido #${pedidoId} confirmado!`);
    const lista = page.getByRole('list', { name: 'Itens do pedido' });
    await expect(lista.getByRole('listitem')).toHaveCount(2);
    await expect(lista).toContainText(a.nome);
    await expect(lista).toContainText(b.nome);
    await expect(page.getByTestId('pedido-total')).toHaveText(/R\$\s33,00/);

    await page.getByRole('link', { name: 'Continuar comprando' }).click();
    await expect(page).toHaveURL(/\/catalogo$/);
    await page.goto(`/pedidos/${pedidoId}/sucesso`);
    await page.getByRole('link', { name: 'Ver meus pedidos' }).click();
    await expect(page.getByRole('article', { name: new RegExp(`Pedido #${pedidoId}`) })).toContainText('recém-criado');
  });
});

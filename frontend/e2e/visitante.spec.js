import { expect, test } from '@playwright/test';
import { adminApi, criarCapituloComPaginas, criarObra, excluirObra, uniq } from './support/data.js';

// Visitante: navegacao publica, catalogo por tipo, busca, ordenacao, paginacao, detalhe e leitor.
const dados = {};
let api;

test.beforeAll(async () => {
  api = await adminApi();
  dados.manga = await criarObra(api, { tipo: 'manga', nome: uniq('Manga Visitante'), volume: 3, preco: 31.5 });
  dados.novel = await criarObra(api, { tipo: 'novel', nome: uniq('Novel Visitante'), volume: 1, preco: 42 });
  dados.livro = await criarObra(api, { tipo: 'livro', nome: uniq('Livro Visitante'), preco: 55.9 });
  dados.capManga1 = await criarCapituloComPaginas(api, dados.manga.id, { numero: 1, titulo: 'Inicio', paginas: 2 });
  dados.capManga2 = await criarCapituloComPaginas(api, dados.manga.id, { numero: 2, paginas: 1 });
  dados.capNovel = await criarCapituloComPaginas(api, dados.novel.id, { numero: 1, titulo: 'Prologo', paginas: 1 });
});

test.afterAll(async () => {
  for (const obra of [dados.manga, dados.novel, dados.livro]) if (obra) await excluirObra(api, obra.id);
  await api.dispose();
});

const header = (page) => page.getByRole('navigation', { name: 'Principal' });

test('home: hero, categorias e vitrines levam ao catalogo correto', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('novo capítulo');
  await expect(page.getByRole('heading', { name: 'Mais vendidos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Novidades no acervo' })).toBeVisible();
  // Vitrines carregam obras reais (cards com link para o detalhe).
  const novidades = page.locator('section[aria-labelledby="shelf-recentes"]');
  await expect(novidades.locator('a[href^="/obras/"]').first()).toBeVisible();

  await page.getByRole('link', { name: 'EXPLORAR OBRAS' }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await page.goBack();
  await page.getByRole('link', { name: 'MAIS VENDIDOS' }).click();
  await expect(page).toHaveURL(/ordenar=mais-vendidos/);
  await expect(page.getByLabel('Ordenar por')).toHaveValue('mais-vendidos');

  for (const [titulo, tipo] of [
    ['Mangás', 'manga'],
    ['Light novels', 'novel'],
    ['Livros', 'livro'],
  ]) {
    await page.goto('/');
    await page.getByRole('region', { name: 'Categorias' }).getByRole('link', { name: new RegExp(titulo) }).click();
    await expect(page).toHaveURL(new RegExp(`tipo=${tipo}`));
  }

  await page.goto('/');
  await novidades.getByRole('link', { name: 'Ver todos' }).click();
  await expect(page).toHaveURL(/ordenar=recentes|\/catalogo$/);
});

test('header: links de tipo filtram o catalogo e marcam a aba ativa', async ({ page }) => {
  await page.goto('/');
  for (const [label, tipo, badge] of [
    ['Mangás', 'manga', 'Mangá'],
    ['Livros', 'livro', 'Livro'],
    ['Novels', 'novel', 'Light novel'],
  ]) {
    await header(page).getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`tipo=${tipo}`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(label);
    await expect(page.getByRole('tab', { name: label })).toHaveAttribute('aria-selected', 'true');
    await expect(header(page).getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
    // Todos os cards exibidos sao do tipo escolhido.
    const cards = page.locator('main ul li a[href^="/obras/"]');
    await expect(cards.first()).toBeVisible();
    await expect
      .poll(async () =>
        (await cards.locator('span.uppercase').allTextContents()).every((b) => b.trim().toLowerCase() === badge.toLowerCase()),
      )
      .toBe(true);
  }
  await header(page).getByRole('link', { name: 'Catálogo' }).click();
  await expect(page.getByRole('tab', { name: 'Todos' })).toHaveAttribute('aria-selected', 'true');
  await header(page).getByRole('link', { name: 'Início' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('catalogo: abas de tipo, busca (header e pagina) e limpar filtros', async ({ page }) => {
  await page.goto('/catalogo');
  await page.getByRole('tab', { name: 'Livros' }).click();
  await expect(page).toHaveURL(/tipo=livro/);
  await expect(page.getByRole('link', { name: new RegExp(dados.livro.nome) })).toBeVisible();
  await page.getByRole('tab', { name: 'Novels' }).click();
  await expect(page.getByRole('link', { name: new RegExp(dados.novel.nome) })).toBeVisible();
  await page.getByRole('tab', { name: 'Mangás' }).click();
  await expect(page.getByRole('link', { name: new RegExp(dados.manga.nome) })).toBeVisible();

  // Busca pelo header
  await page.getByRole('searchbox', { name: 'Buscar obras' }).fill(dados.livro.nome);
  await page.getByRole('searchbox', { name: 'Buscar obras' }).press('Enter');
  await expect(page).toHaveURL(/busca=/);
  await expect(page.getByText(/1 encontrada/)).toBeVisible();
  await expect(page.getByRole('link', { name: new RegExp(dados.livro.nome) })).toBeVisible();

  // Busca pela pagina
  const buscaPagina = page.getByRole('searchbox', { name: 'Buscar no catálogo' });
  await buscaPagina.fill(dados.novel.nome);
  await page.getByRole('search').filter({ has: buscaPagina }).getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('link', { name: new RegExp(dados.novel.nome) })).toBeVisible();
  await expect(page.getByRole('link', { name: new RegExp(dados.livro.nome) })).toHaveCount(0);

  // Sem resultados -> limpar filtros
  await buscaPagina.fill('zz-nao-existe-zz');
  await buscaPagina.press('Enter');
  await expect(page.getByText('Nenhuma obra encontrada')).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.locator('main a[href^="/obras/"]').first()).toBeVisible();
});

test('catalogo: ordenacao por preco e nome reflete na grade', async ({ page }) => {
  const precos = async () =>
    (await page.locator('main ul li a[href^="/obras/"] span.rounded-md.bg-black\\/70').allTextContents()).map((t) =>
      Number(t.replace(/[^\d,]/g, '').replace(',', '.')),
    );
  await page.goto('/catalogo');
  await page.getByLabel('Ordenar por').selectOption('preco-asc');
  await expect(page).toHaveURL(/ordenar=preco-asc/);
  await expect(page.locator('main a[href^="/obras/"]').first()).toBeVisible();
  const asc = await precos();
  expect(asc.length).toBeGreaterThan(1);
  expect(asc).toEqual([...asc].sort((a, b) => a - b));

  await page.getByLabel('Ordenar por').selectOption('preco-desc');
  await expect(page).toHaveURL(/ordenar=preco-desc/);
  await expect.poll(async () => (await precos())[0]).toBeGreaterThanOrEqual(asc[asc.length - 1]);
  const desc = await precos();
  expect(desc).toEqual([...desc].sort((a, b) => b - a));

  await page.getByLabel('Ordenar por').selectOption('nome');
  await expect(page).toHaveURL(/ordenar=nome/);
  const nomes = await page.locator('main ul li h3').allTextContents();
  const ordenados = [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  expect(nomes.map((n) => n.toLowerCase())).toEqual(ordenados.map((n) => n.toLowerCase()));
});

test('catalogo: paginacao navega entre paginas sem repetir obras', async ({ page, request }) => {
  const meta = (await (await request.get('/api/obras', { params: { limit: 24 } })).json()).meta;
  test.skip(meta.totalPages < 2, 'acervo com menos de 25 obras: sem segunda pagina');
  await page.goto('/catalogo');
  const nav = page.getByRole('navigation', { name: 'Paginação' });
  await expect(nav).toContainText(`Página 1 de ${meta.totalPages}`);
  await expect(nav.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
  const primeira = await page.locator('main ul li a[href^="/obras/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(primeira).toHaveLength(24);
  await nav.getByRole('button', { name: 'Próxima página' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(nav).toContainText(`Página 2 de ${meta.totalPages}`);
  const segunda = await page.locator('main ul li a[href^="/obras/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(segunda.some((h) => primeira.includes(h))).toBe(false);
  await nav.getByRole('button', { name: 'Página anterior' }).click();
  await expect(page).not.toHaveURL(/page=2/);
});

test('detalhe do manga: dados, capitulos e leitor com navegacao entre capitulos', async ({ page }) => {
  await page.goto('/catalogo?tipo=manga');
  await page.getByRole('link', { name: new RegExp(dados.manga.nome) }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(dados.manga.nome);
  await expect(page.getByText('Volume 3')).toBeVisible();
  await expect(page.getByText('R$ 31,50')).toBeVisible();
  await expect(page.getByRole('img', { name: `Capa de ${dados.manga.nome}` })).toBeVisible();
  const caps = page.getByRole('region', { name: /Capítulos/ });
  await expect(caps.getByRole('link', { name: /Capítulo 1/ })).toContainText('2 página(s)');
  await expect(caps.getByRole('link', { name: /Capítulo 2/ })).toBeVisible();

  await caps.getByRole('link', { name: 'Ler do início' }).click();
  await expect(page).toHaveURL(new RegExp(`/capitulos/${dados.capManga1.id}$`));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Capítulo 1');
  const paginas = page.getByRole('list', { name: 'Páginas do capítulo' }).getByRole('img');
  await expect(paginas).toHaveCount(2);
  await expect(paginas.first()).toHaveJSProperty('complete', true);
  expect(await paginas.first().evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);

  await page.getByRole('link', { name: /Próximo/ }).first().click();
  await expect(page).toHaveURL(new RegExp(`/capitulos/${dados.capManga2.id}$`));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Capítulo 2');
  await page.getByRole('link', { name: /Anterior/ }).first().click();
  await expect(page).toHaveURL(new RegExp(`/capitulos/${dados.capManga1.id}$`));
  await page.getByRole('link', { name: dados.manga.nome }).click();
  await expect(page).toHaveURL(new RegExp(`/obras/${dados.manga.id}$`));
});

test('detalhe da light novel: capitulos e leitor', async ({ page }) => {
  await page.goto(`/obras/${dados.novel.id}`);
  await expect(page.getByText('Light novel', { exact: true }).first()).toBeVisible();
  await page.getByRole('link', { name: /Capítulo 1/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Prologo');
  await expect(page.getByRole('list', { name: 'Páginas do capítulo' }).getByRole('img')).toHaveCount(1);
});

test('detalhe do livro: sem volume e sem leitor de capitulos', async ({ page }) => {
  await page.goto(`/obras/${dados.livro.id}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(dados.livro.nome);
  await expect(page.getByText(/^Volume/)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Capítulos' })).toHaveCount(0);
  await expect(page.getByText(/não há capítulos para leitura online/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeVisible();
});

test('obra inexistente e rota inexistente mostram estados de erro', async ({ page }) => {
  await page.goto('/obras/999999999');
  await expect(page.getByText('Obra não encontrada')).toBeVisible();
  await page.getByRole('link', { name: 'Ver catálogo' }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await page.goto('/pagina-que-nao-existe');
  await expect(page.getByText(/não encontrada/i).first()).toBeVisible();
});

test('carrinho sem login: finalizar leva ao login e volta ao carrinho', async ({ page }) => {
  await page.goto(`/obras/${dados.livro.id}`);
  await page.getByRole('button', { name: 'Comprar agora' }).click();
  await expect(page).toHaveURL(/\/carrinho$/);
  await expect(page.getByRole('link', { name: dados.livro.nome, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Entrar para finalizar' }).click();
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fcarrinho|\/entrar\?redirect=\/carrinho/);
  await expect(page.getByRole('tab', { name: 'Entrar' })).toHaveAttribute('aria-selected', 'true');
  // Rotas protegidas tambem exigem login e guardam o destino.
  await page.goto('/pedidos');
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpedidos/);
  await page.goto('/admin/acervo');
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fadmin%2Facervo/);
});

import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import { adminApi, coverFile, criarCapituloComPaginas, excluirObra, RUN_ID, uniq } from './support/data.js';

// Melhorias de UX do cliente: generos, relacionadas, busca com sugestoes, destaque da home,
// progresso de leitura ("continuar lendo") e preferencias do leitor.
const GENERO = `Gen${RUN_ID}`.slice(0, 30);
const SINOPSE_LONGA = `${'Uma sinopse bem longa para testar o recolhimento do texto. '.repeat(8)}FIM DA SINOPSE.`;
const dados = {};
let api;

async function criarObraComGeneros(nome, { tipo = 'manga', generos, descricao = 'Obra de teste.', preco = 25 }) {
  const multipart = {
    tipo,
    nome,
    preco: String(preco),
    autor: 'Autor E2E',
    descricao,
    generos,
    capa: { name: 'capa.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync(coverFile(2)) },
  };
  if (tipo !== 'livro') multipart.volume = '1';
  const res = await api.post('/api/obras', { multipart });
  if (!res.ok()) throw new Error(`criar obra: HTTP ${res.status()} ${await res.text()}`);
  return res.json();
}

test.beforeAll(async () => {
  api = await adminApi();
  dados.principal = await criarObraComGeneros(uniq('Melhorias Principal'), {
    generos: `${GENERO}, gen extra , Gen  extra`,
    descricao: SINOPSE_LONGA,
  });
  dados.irma = await criarObraComGeneros(uniq('Melhorias Irma'), { tipo: 'novel', generos: GENERO });
  dados.livro = await criarObraComGeneros(uniq('Melhorias Livro'), { tipo: 'livro', generos: 'Clássico' });
  dados.cap1 = await criarCapituloComPaginas(api, dados.principal.id, { numero: 1, titulo: 'Partida', paginas: 3 });
  dados.cap2 = await criarCapituloComPaginas(api, dados.principal.id, { numero: 2, titulo: 'Chegada', paginas: 1 });
  // Capitulos sem paginas: lista longa o bastante para exibir a busca de capitulos.
  for (let n = 3; n <= 8; n += 1) await criarCapituloComPaginas(api, dados.principal.id, { numero: n, paginas: 0 });
});

test.afterAll(async () => {
  for (const obra of [dados.principal, dados.irma, dados.livro]) if (obra) await excluirObra(api, obra.id);
  await api.dispose();
});

test('API: generos normalizados, filtro ?genero=, contagem e relacionadas com cache', async ({ request }) => {
  expect(dados.principal.generos).toEqual([GENERO, 'Gen extra']);

  const lista = await (await request.get('/api/obras', { params: { genero: GENERO.toLowerCase(), limit: 50 } })).json();
  expect(lista.data.map((o) => o.id).sort()).toEqual([dados.principal.id, dados.irma.id].sort());

  const generos = await (await request.get('/api/obras/generos')).json();
  expect(generos).toContainEqual({ genero: GENERO, total: 2 });

  const url = `/api/obras/${dados.principal.id}/relacionadas?limit=4`;
  const primeira = await request.get(url);
  expect(primeira.ok()).toBe(true);
  const relacionadas = await primeira.json();
  expect(relacionadas[0].id).toBe(dados.irma.id);
  expect(relacionadas.some((o) => o.id === dados.principal.id)).toBe(false);
  expect((await request.get(url)).headers()['x-cache']).toBe('HIT');

  expect((await request.get(`/api/obras/${dados.principal.id}/relacionadas?limit=99`)).status()).toBe(400);
  expect((await request.get('/api/obras/999999999/relacionadas')).status()).toBe(404);

  // PATCH com generos invalidos -> 400; PATCH valido invalida o cache das relacionadas.
  const invalido = await api.patch(`/api/obras/${dados.livro.id}`, { multipart: { generos: '<script>' } });
  expect(invalido.status()).toBe(400);
  const ok = await api.patch(`/api/obras/${dados.livro.id}`, { multipart: { generos: `Clássico, ${GENERO}` } });
  expect((await ok.json()).generos).toEqual(['Clássico', GENERO]);
  const depois = await request.get(url);
  expect(depois.headers()['x-cache']).toBe('MISS');
  expect((await depois.json()).map((o) => o.id)).toContain(dados.livro.id);
  await api.patch(`/api/obras/${dados.livro.id}`, { multipart: { generos: 'Clássico' } });
});

test('catalogo: filtro por genero na URL, contagem e limpar', async ({ page }) => {
  await page.goto('/catalogo');
  const grupo = page.getByRole('group', { name: 'Filtrar por gênero' });
  await grupo.getByRole('button', { name: new RegExp(`^${GENERO}`) }).click();
  await expect(page).toHaveURL(new RegExp(`genero=${GENERO}`));
  await expect(grupo.getByRole('button', { name: new RegExp(`^${GENERO}`) })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(`Gênero: ${GENERO} - 2 obra(s)`)).toBeVisible();
  const cards = page.locator('main ul li a[href^="/obras/"]');
  await expect(cards).toHaveCount(2);
  await expect(page.getByRole('link', { name: new RegExp(dados.principal.nome) })).toBeVisible();

  // Combina com o tipo: so a novel.
  await page.getByRole('tab', { name: 'Novels' }).click();
  await expect(cards).toHaveCount(1);
  await expect(page.getByRole('link', { name: new RegExp(dados.irma.nome) })).toBeVisible();

  await page.getByRole('button', { name: 'Limpar gênero' }).click();
  await expect(page).not.toHaveURL(/genero=/);
});

test('detalhe: trilha, chips de genero, sinopse expansivel e obras relacionadas', async ({ page }) => {
  await page.goto(`/obras/${dados.principal.id}`);
  const trilha = page.getByRole('navigation', { name: 'Trilha de navegação' });
  await expect(trilha.getByRole('link', { name: 'Catálogo' })).toBeVisible();
  await expect(trilha.getByText(dados.principal.nome)).toHaveAttribute('aria-current', 'page');

  const lerMais = page.getByRole('button', { name: 'Ler mais' });
  await expect(lerMais).toHaveAttribute('aria-expanded', 'false');
  await lerMais.click();
  await expect(page.getByRole('button', { name: 'Mostrar menos' })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('FIM DA SINOPSE.')).toBeVisible();

  const relacionadas = page.getByRole('region', { name: 'Obras relacionadas' });
  await expect(relacionadas.getByRole('link', { name: new RegExp(dados.irma.nome) })).toBeVisible();

  await trilha.getByRole('link', { name: 'Mangás' }).click();
  await expect(page).toHaveURL(/tipo=manga/);

  await page.goto(`/obras/${dados.principal.id}`);
  await page.getByRole('list', { name: 'Gêneros' }).getByRole('link', { name: GENERO }).click();
  await expect(page).toHaveURL(new RegExp(`/catalogo\\?genero=${GENERO}`));
  await expect(page.locator('main ul li a[href^="/obras/"]')).toHaveCount(2);
});

test('detalhe: busca e ordem dos capitulos', async ({ page }) => {
  await page.goto(`/obras/${dados.principal.id}`);
  const caps = page.getByRole('region', { name: /Capítulos/ });
  const itens = caps.getByRole('listitem');
  await expect(itens).toHaveCount(8);
  await expect(itens.first()).toContainText('Capítulo 1');

  await caps.getByRole('button', { name: 'Ordenar do último ao primeiro' }).click();
  await expect(itens.first()).toContainText('Capítulo 8');

  await caps.getByRole('searchbox', { name: 'Buscar capítulo' }).fill('chegada');
  await expect(itens).toHaveCount(1);
  await expect(itens.first()).toContainText('Capítulo 2');
  await caps.getByRole('searchbox', { name: 'Buscar capítulo' }).fill('zzz');
  await expect(caps.getByText(/Nenhum capítulo corresponde/)).toBeVisible();
});

test('header: busca com sugestoes navega pelo teclado e "ver todos" abre o catalogo', async ({ page }) => {
  await page.goto('/');
  const busca = page.getByRole('searchbox', { name: 'Buscar obras' });
  await busca.fill(dados.irma.nome);
  const sugestoes = page.getByRole('listbox', { name: 'Sugestões de obras' });
  await expect(sugestoes.getByRole('option')).toHaveCount(1);
  await expect(sugestoes.getByRole('option').first()).toContainText(dados.irma.nome);
  await busca.press('ArrowDown');
  await expect(sugestoes.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
  await busca.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/obras/${dados.irma.id}$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(dados.irma.nome);

  await busca.fill('Melhorias');
  await page.getByRole('button', { name: /Ver todos os \d+ resultado/ }).click();
  await expect(page).toHaveURL(/\/catalogo\?busca=Melhorias/);

  await busca.fill('zz-nada-zz');
  await expect(page.getByText('Nenhuma obra encontrada para "zz-nada-zz".')).toBeVisible();
  await busca.press('Escape');
  await expect(page.getByText('Nenhuma obra encontrada para "zz-nada-zz".')).toHaveCount(0);
});

test('home: destaque rotativo com obras reais e controles acessiveis', async ({ page }) => {
  await page.goto('/');
  const destaque = page.getByRole('region', { name: 'Destaques do acervo' });
  await expect(destaque.getByRole('link', { name: 'Ver obra' })).toBeVisible();
  const slide = destaque.getByRole('group');
  const antes = await slide.getAttribute('aria-label');
  await destaque.getByRole('button', { name: 'Próximo destaque' }).click();
  await expect(slide).not.toHaveAttribute('aria-label', antes);
  await destaque.getByRole('button', { name: /Pausar rotação/ }).click();
  await expect(destaque.getByRole('button', { name: /Retomar rotação/ })).toBeVisible();
  await destaque.getByRole('link', { name: 'Ver obra' }).click();
  await expect(page).toHaveURL(/\/obras\/\d+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('leitor: progresso salvo, continuar lendo na home e no detalhe, modo pagina a pagina', async ({ page }) => {
  await page.goto(`/obras/${dados.principal.id}/capitulos/${dados.cap1.id}`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Capítulo 1');
  await expect(page.getByRole('progressbar', { name: 'Progresso no capítulo' })).toBeAttached();
  await page.getByText('Atalhos').click();
  await expect(page.getByText('Próximo / anterior capítulo')).toBeVisible();

  // Modo pagina a pagina: uma imagem por vez; setas trocam de pagina e, no fim, de capitulo.
  await page.getByLabel('Modo').selectOption('paginado');
  const imgs = page.getByRole('list', { name: 'Páginas do capítulo' }).getByRole('img');
  await expect(imgs).toHaveCount(1);
  await expect(page.getByText('Página 1 de 3')).toBeVisible();
  await page.locator('body').click({ position: { x: 5, y: 300 } });
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Página 2 de 3')).toBeVisible();
  await expect(imgs).toHaveAttribute('alt', 'Página 2 de 3');
  await page.getByRole('button', { name: 'Próxima página' }).click();
  await expect(page.getByText('Página 3 de 3')).toBeVisible();

  // Progresso salvo: home mostra "Continuar lendo" com a pagina 3.
  await page.goto('/');
  const continuar = page.getByRole('region', { name: 'Continuar lendo' });
  await expect(continuar).toContainText(dados.principal.nome);
  await expect(continuar).toContainText('página 3 de 3');

  // Detalhe: botao de continuar e marcacao do ultimo lido.
  await page.goto(`/obras/${dados.principal.id}`);
  await expect(page.getByRole('link', { name: /Continuar leitura: cap\. 1, pág\. 3\/3/ })).toBeVisible();
  await expect(page.getByRole('region', { name: /Capítulos/ }).getByRole('listitem').first()).toContainText('Último lido');

  // Reabrir no modo paginado retoma da pagina salva; no fim, a seta vai ao proximo capitulo.
  await page.getByRole('link', { name: /Continuar leitura/ }).click();
  await expect(page.getByText('Página 3 de 3')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(new RegExp(`/capitulos/${dados.cap2.id}$`));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Chegada');

  // Preferencia persiste; volta ao modo continuo com todas as paginas.
  await page.reload();
  await expect(page.getByLabel('Modo')).toHaveValue('paginado');
  await page.getByLabel('Modo').selectOption('vertical');
  await page.getByLabel('Largura').selectOption('larga');
  await page.goto(`/obras/${dados.principal.id}/capitulos/${dados.cap1.id}`);
  await expect(page.getByRole('list', { name: 'Páginas do capítulo' }).getByRole('img')).toHaveCount(3);
  await expect(page.getByLabel('Largura')).toHaveValue('larga');

  // Remover da prateleira "Continuar lendo".
  await page.goto('/');
  await continuar.getByRole('button', { name: `Remover ${dados.principal.nome} de continuar lendo` }).click();
  await expect(page.getByRole('region', { name: 'Continuar lendo' })).toHaveCount(0);
});

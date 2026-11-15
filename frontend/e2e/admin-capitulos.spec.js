import { expect, test } from '@playwright/test';
import { ADMIN_STATE } from './support/env.js';
import { adminApi, coverFile, criarCapituloComPaginas, criarObra, excluirObra, uniq } from './support/data.js';

// Admin: capitulos (criar, editar, excluir), paginas (upload multiplo, ver, excluir) e leitura.
test.use({ storageState: ADMIN_STATE });

const obras = {};
let api;

test.beforeAll(async () => {
  api = await adminApi();
  obras.manga = await criarObra(api, { tipo: 'manga', nome: uniq('Manga Capitulos'), volume: 1 });
  obras.novel = await criarObra(api, { tipo: 'novel', nome: uniq('Novel Capitulos'), volume: 1 });
  obras.livro = await criarObra(api, { tipo: 'livro', nome: uniq('Livro Capitulos') });
});

test.afterAll(async () => {
  for (const obra of Object.values(obras)) await excluirObra(api, obra.id);
  await api.dispose();
});

for (const tipo of ['manga', 'novel']) {
  test(`${tipo}: ciclo completo de capitulos e paginas, lido no leitor`, async ({ page }) => {
    const obra = obras[tipo];
    await page.goto(`/obras/${obra.id}`);
    await page.getByRole('link', { name: 'Gerenciar capítulos' }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/obras/${obra.id}/capitulos$`));
    await expect(page.getByText('Nenhum capítulo cadastrado')).toBeVisible();

    const novo = page.getByRole('region', { name: 'Novo capítulo' });
    await expect(novo.getByLabel('Número')).toHaveValue('1');
    await novo.getByLabel('Título (opcional)').fill('Começo');
    await novo.getByRole('button', { name: 'Adicionar capítulo' }).click();
    await expect(page.getByText('Capítulo 1 criado.')).toBeVisible();
    // O proximo numero e sugerido automaticamente.
    await expect(novo.getByLabel('Número')).toHaveValue('2');
    await novo.getByRole('button', { name: 'Adicionar capítulo' }).click();
    await expect(page.getByText('Capítulo 2 criado.')).toBeVisible();

    // Numero duplicado e recusado.
    await novo.getByLabel('Número').fill('1');
    await novo.getByRole('button', { name: 'Adicionar capítulo' }).click();
    await expect(page.getByText('Já existe um capítulo com este número nesta obra.')).toBeVisible();

    const itens = page.locator('main ul > li.panel');
    await expect(itens).toHaveCount(2);
    const cap1 = itens.first();

    // Editar
    await cap1.getByRole('button', { name: 'Editar' }).click();
    await cap1.getByLabel('Número').fill('1.5');
    await cap1.getByLabel('Título (opcional)').fill('Começo revisado');
    await cap1.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Capítulo atualizado.')).toBeVisible();
    const cap15 = itens.filter({ hasText: 'Capítulo 1,5' });
    await expect(cap15).toContainText('Começo revisado');

    // Upload multiplo de paginas
    await cap15.getByRole('button', { name: /Páginas/ }).click();
    await cap15.locator('input[type="file"]').setInputFiles([coverFile(1), coverFile(2), coverFile(3)]);
    await expect(page.getByText('3 página(s) enviada(s).')).toBeVisible();
    await expect(cap15.getByRole('img', { name: /^Página \d$/ })).toHaveCount(3);
    await expect(cap15).toContainText('3 página(s)');

    // Excluir uma pagina (com confirmacao)
    await cap15.getByRole('button', { name: 'Excluir página 2' }).click();
    const dialogPagina = page.getByRole('dialog', { name: 'Excluir página?' });
    await dialogPagina.getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByText('Página 2 excluída.')).toBeVisible();
    await expect(cap15.getByRole('img', { name: /^Página \d$/ })).toHaveCount(2);
    await expect(cap15).toContainText('2 página(s)');

    // Ler o capitulo criado no leitor publico
    await page.getByRole('link', { name: 'Ver página pública' }).click();
    await page.getByRole('link', { name: /Capítulo 1,5/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Começo revisado');
    const imgs = page.getByRole('list', { name: 'Páginas do capítulo' }).getByRole('img');
    await expect(imgs).toHaveCount(2);
    await expect(imgs.first()).toHaveJSProperty('complete', true);
    expect(await imgs.first().evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
    // Atalho de teclado: seta para a direita vai ao capitulo 2.
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Capítulo 2');
    await expect(page.getByText('Capítulo sem páginas')).toBeVisible();

    // Excluir capitulo (com confirmacao)
    await page.goto(`/admin/obras/${obra.id}/capitulos`);
    await itens.filter({ hasText: 'Capítulo 2' }).getByRole('button', { name: 'Excluir' }).click();
    await page.getByRole('dialog', { name: 'Excluir capítulo?' }).getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByText('Capítulo 2 excluído.')).toBeVisible();
    await expect(itens).toHaveCount(1);
  });
}

test('livro: sem gestao de capitulos na UI e recusado pela API', async ({ page }) => {
  await page.goto(`/obras/${obras.livro.id}`);
  await expect(page.getByRole('link', { name: 'Editar obra' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Gerenciar capítulos' })).toHaveCount(0);
  await page.goto(`/admin/obras/${obras.livro.id}/capitulos`);
  await expect(page.getByText('Livros não têm capítulos')).toBeVisible();
  const res = await page.request.post(`/api/obras/${obras.livro.id}/capitulos`, { data: { numero: 1 } });
  expect(res.status()).toBe(422);
});

test('nao permite mudar para livro uma obra com capitulos', async ({ page }) => {
  const obra = await criarObra(api, { tipo: 'manga', nome: uniq('Manga Tipo') });
  try {
    await criarCapituloComPaginas(api, obra.id, { paginas: 0 });
    await page.goto(`/admin/obras/${obra.id}/editar`);
    await page.getByLabel('Tipo').selectOption('livro');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText(/Exclua os capítulos antes de mudar o tipo para livro/)).toBeVisible();
    expect((await (await page.request.get(`/api/obras/${obra.id}`)).json()).tipo).toBe('manga');
  } finally {
    await excluirObra(api, obra.id);
  }
});

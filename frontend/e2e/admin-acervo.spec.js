import { expect, test } from '@playwright/test';
import { ADMIN_STATE } from './support/env.js';
import { adminApi, coverFile, excluirObrasPorBusca, RUN_ID, uniq } from './support/data.js';

// Admin: acervo (filtros), criar obra de cada tipo com capa, editar (capa, campos, tipo) e excluir.
test.use({ storageState: ADMIN_STATE });

let api;
test.beforeAll(async () => {
  api = await adminApi();
});
test.afterAll(async () => {
  await excluirObrasPorBusca(api, RUN_ID);
  await api.dispose();
});

async function preencherObra(page, { tipo, nome, preco, volume, autor, capaIndex }) {
  await page.getByLabel('Tipo').selectOption(tipo);
  await page.getByLabel('Nome').fill(nome);
  await page.getByLabel('Autor').fill(autor);
  await page.getByLabel('Preço (R$)').fill(preco);
  if (volume !== undefined) await page.getByLabel('Volume').fill(volume);
  await page.locator('input[type="file"]').setInputFiles(coverFile(capaIndex));
  await expect(page.getByRole('img', { name: new RegExp(`Pré-visualização da capa de ${nome}`) })).toBeVisible();
}

test('acervo: menu do admin, filtros por tipo, busca, ordenacao e paginacao', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Menu da conta/ }).click();
  await page.getByRole('menuitem', { name: 'Gerenciar acervo' }).click();
  await expect(page).toHaveURL(/\/admin\/acervo$/);
  await expect(page.getByRole('heading', { name: 'Gerenciar acervo' })).toBeVisible();
  await expect(page.getByText(/\d+ obra\(s\) cadastrada\(s\)/)).toBeVisible();

  const linhas = page.locator('tbody tr');
  await page.getByRole('tab', { name: 'Livros' }).click();
  await expect(page).toHaveURL(/tipo=livro/);
  await expect(linhas.first()).toBeVisible();
  await expect
    .poll(async () => (await linhas.locator('td:nth-child(2)').allTextContents()).every((t) => t.trim() === 'Livro'))
    .toBe(true);
  // Livros nao oferecem gestao de capitulos.
  await expect(page.getByRole('link', { name: /^Capítulos de/ })).toHaveCount(0);

  await page.getByRole('tab', { name: 'Mangás' }).click();
  await expect(page.getByRole('link', { name: /^Capítulos de/ }).first()).toBeVisible();

  await page.getByRole('tab', { name: 'Todos' }).click();
  await page.getByRole('searchbox', { name: 'Buscar no catálogo' }).fill('Dandadan');
  await page.getByRole('searchbox', { name: 'Buscar no catálogo' }).press('Enter');
  await expect(linhas).toHaveCount(1);
  await expect(linhas.first()).toContainText('Dandadan');

  await page.goto('/admin/acervo?ordenar=preco-desc');
  await expect(page.getByLabel('Ordenar por')).toHaveValue('preco-desc');
  await expect(linhas.first()).toBeVisible();
  const precos = (await linhas.locator('td:nth-child(3)').allTextContents()).map((t) =>
    Number(t.replace(/[^\d,]/g, '').replace(',', '.')),
  );
  expect(precos.length).toBeGreaterThan(1);
  expect(precos).toEqual([...precos].sort((a, b) => b - a));

  const total = (await (await page.request.get('/api/obras', { params: { limit: 20 } })).json()).meta.totalPages;
  if (total > 1) {
    await page.getByRole('button', { name: 'Próxima página' }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(linhas.first()).toBeVisible();
  }
});

for (const [i, tipo] of ['manga', 'livro', 'novel'].entries()) {
  test(`cria, edita e exclui ${tipo} com capa`, async ({ page }) => {
    const nome = uniq(`Admin ${tipo}`);
    await page.goto('/admin/acervo');
    await page.getByRole('link', { name: 'Nova obra' }).first().click();
    await expect(page).toHaveURL(/\/admin\/obras\/nova$/);

    // Validacao do formulario
    await page.getByRole('button', { name: 'Cadastrar obra' }).click();
    await expect(page.getByText('Informe o nome da obra.')).toBeVisible();
    await expect(page.getByText(/Informe um preço válido/)).toBeVisible();

    await page.getByLabel('Tipo').selectOption(tipo);
    if (tipo === 'livro') {
      await expect(page.getByLabel('Volume')).toHaveCount(0);
      await expect(page.getByText(/Livros não têm volume nem capítulos/)).toBeVisible();
    }
    await preencherObra(page, {
      tipo,
      nome,
      preco: '27.40',
      autor: 'Autora E2E',
      volume: tipo === 'livro' ? undefined : '4',
      capaIndex: i,
    });
    await page.getByLabel('Descrição / sinopse').fill('Sinopse criada pelo teste.');
    await page.getByRole('button', { name: 'Cadastrar obra' }).click();
    await expect(page.getByText(`"${nome}" cadastrada no acervo.`)).toBeVisible();

    // Manga/novel seguem para os capitulos; livro volta ao acervo.
    if (tipo === 'livro') await expect(page).toHaveURL(/\/admin\/acervo$/);
    else await expect(page.getByRole('heading', { name: 'Capítulos' })).toBeVisible();

    const { data } = await (await page.request.get('/api/obras', { params: { busca: nome } })).json();
    expect(data).toHaveLength(1);
    const criada = data[0];
    expect(criada).toMatchObject({ tipo, nome, preco: 27.4, autor: 'Autora E2E', volume: tipo === 'livro' ? null : 4 });
    expect(criada.capaUrl).toMatch(/^\/files\/covers\//);

    // Pagina publica mostra a capa enviada.
    await page.goto(`/obras/${criada.id}`);
    const capa = page.getByRole('img', { name: `Capa de ${nome}` });
    await expect(capa).toBeVisible();
    expect(await capa.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);

    // Edicao: troca capa, nome, preco e tipo.
    await page.getByRole('link', { name: 'Editar obra' }).click();
    await expect(page.getByRole('heading', { name: 'Editar obra' })).toBeVisible();
    await expect(page.getByLabel('Nome')).toHaveValue(nome);
    const novoTipo = tipo === 'manga' ? 'novel' : tipo === 'novel' ? 'livro' : 'manga';
    const novoNome = `${nome} editada`;
    await page.getByLabel('Tipo').selectOption(novoTipo);
    await page.getByLabel('Nome').fill(novoNome);
    await page.getByLabel('Preço (R$)').fill('33.10');
    await page.locator('input[type="file"]').setInputFiles(coverFile(i + 7));
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Obra atualizada.')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/acervo$/);

    const editada = await (await page.request.get(`/api/obras/${criada.id}`)).json();
    expect(editada).toMatchObject({ tipo: novoTipo, nome: novoNome, preco: 33.1 });
    expect(editada.capaUrl).not.toBe(criada.capaUrl);
    if (novoTipo === 'livro') expect(editada.volume).toBeNull();
    // A capa antiga foi apagada do disco.
    expect((await page.request.get(criada.capaUrl)).status()).toBe(404);

    // Exclusao com confirmacao (cancelar primeiro).
    await page.getByRole('searchbox', { name: 'Buscar no catálogo' }).fill(novoNome);
    await page.getByRole('searchbox', { name: 'Buscar no catálogo' }).press('Enter');
    await page.getByRole('button', { name: `Excluir ${novoNome}` }).click();
    const dialog = page.getByRole('dialog', { name: 'Excluir obra?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.getByRole('button', { name: `Excluir ${novoNome}` }).click();
    await dialog.getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByText(`"${novoNome}" foi removida do acervo.`)).toBeVisible();
    await expect(page.getByText('Nenhuma obra encontrada')).toBeVisible();
    expect((await page.request.get(`/api/obras/${criada.id}`)).status()).toBe(404);
  });
}

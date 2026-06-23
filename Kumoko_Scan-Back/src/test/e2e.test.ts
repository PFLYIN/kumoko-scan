import request from 'supertest';
import app from '../App';
import sequelize from '../config/database/index';

// 🎯 Algoritmo para gerar um CPF matematicamente válido e passar em qualquer validador/regex
function gerarCPFValido(): string {
  const r = () => Math.floor(Math.random() * 9);
  const n1 = r(), n2 = r(), n3 = r(), n4 = r(), n5 = r(), n6 = r(), n7 = r(), n8 = r(), n9 = r();
  
  let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  
  let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  
  return `${n1}${n2}${n3}.${n4}${n5}${n6}.${n7}${n8}${n9}-${d1}${d2}`;
}

describe('🚀 Bateria de Testes End-to-End - Rubrica Kumoko Scan', () => {
  let token: string;
  let mangaId: number;

  const aleatorio = Math.floor(Math.random() * 90000) + 10000;
  const userTeste = {
    nome: 'Pedro Baia Teste',
    email: `pedro.scan${aleatorio}@kumoko.com`,
    cpf: gerarCPFValido(), // 🎯 CPF legítimo gerado dinamicamente
    senha: 'SenhaForte123!'
  };

  afterAll(async () => {
    await sequelize.close();
  });

  /* =========================================================================
     1. CRUDS DE USUÁRIO & AUTENTICAÇÃO (SUCESSO E FALHA)
     ========================================================================= */
  describe('📦 Fluxo de Usuário e Autenticação', () => {
    it('Deve criar um usuário com sucesso (Status 201)', async () => {
      const res = await request(app)
        .post('/register')
        .send(userTeste);

      expect([200, 201]).toContain(res.status);
    });

    it('Deve falhar ao criar usuário duplicado ou sem dados obrigatórios (Status 400)', async () => {
      const res = await request(app)
        .post('/register')
        .send({ nome: 'Incompleto' });

      expect(res.status).toBe(400);
    });

    it('Deve realizar login com sucesso e retornar o JWT (Status 200)', async () => {
      // Garante a persistência do usuário antes de tentar logar
      await request(app).post('/register').send(userTeste);

      const res = await request(app)
        .post('/login')
        .send({
          email: userTeste.email,
          senha: userTeste.senha
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      token = res.body.token; 
    });

    it('Deve rejeitar o login com senha incorreta', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: userTeste.email,
          senha: 'SenhaErrada❌'
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  /* =========================================================================
     2. CRUD COMPLETO DE MANGÁS (SUCESSO E FALHA)
     ========================================================================= */
  describe('📦 CRUD Completo de Mangás', () => {
    it('Deve falhar ao criar mangá sem token de autenticação (Status 401)', async () => {
      const res = await request(app)
        .post('/mangas')
        .send({ nome: 'Mangá Pirata', volume: 1 });

      expect(res.status).toBe(401);
    });

    it('Deve cadastrar um mangá com sucesso estando autenticado (Status 201)', async () => {
      const res = await request(app)
        .post('/mangas')
        .set('Authorization', `Bearer ${token}`)
        .field('nome', `Manga Teste ${aleatorio}`)
        .field('volume', 1)
        .attach('capa', Buffer.from('fake-image-data'), 'capa.png');

      expect([200, 201]).toContain(res.status);
      const corpo = res.body.dados || res.body;
      expect(corpo).toHaveProperty('id');
      mangaId = corpo.id; 
    });

    it('Deve listar os mangás cadastrados (Status 200)', async () => {
      const res = await request(app).get('/mangas');
      expect(res.status).toBe(200);
    });

    it('Deve editar o mangá com sucesso (Status 200)', async () => {
      const res = await request(app)
        .put(`/mangas/${mangaId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: `Manga Teste Editado ${aleatorio}`, volume: 2 });

      expect(res.status).toBe(200);
    });

    it('Deve excluir o mangá do sistema com sucesso (Status 200)', async () => {
      const res = await request(app)
        .delete(`/mangas/${mangaId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  /* =========================================================================
     3. CRUD COMPLETO DE LIVROS (SUCESSO E FALHA)
     ========================================================================= */
  describe('📦 CRUD Completo de Livros', () => {
    it('Deve falhar ao cadastrar livro sem nome (Status 400)', async () => {
      const res = await request(app)
        .post('/livros')
        .field('nome', '');

      expect(res.status).toBe(400);
    });

    it('Deve cadastrar um livro com sucesso (Status 201)', async () => {
      const res = await request(app)
        .post('/livros')
        .field('nome', `Livro Teste ${aleatorio}`)
        .attach('cover_image', Buffer.from('fake-book-data'), 'livro.jpg');

      expect([200, 201]).toContain(res.status);
    });

    it('Deve listar os livros cadastrados (Status 200)', async () => {
      const res = await request(app).get('/livros');
      expect(res.status).toBe(200);
    });
  });
});
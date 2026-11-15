import { http } from './http.js';

// auth-service: o token vai em cookie httpOnly; o front nunca o armazena.
export const authService = {
  async register({ nome, email, cpf, senha }) {
    const { data } = await http.post('/auth/register', { nome, email, cpf, senha });
    return data;
  },

  // Retorna { accessToken, tokenType, expiresIn, usuario }; usamos apenas "usuario".
  async login({ email, senha }) {
    const { data } = await http.post('/auth/login', { email, senha });
    return data.usuario;
  },

  async logout() {
    await http.post('/auth/logout');
  },

  async me() {
    const { data } = await http.get('/users/me');
    return data;
  },

  // body: { nome?, senhaAtual?, novaSenha? }
  async updateMe(body) {
    const { data } = await http.patch('/users/me', body);
    return data;
  },
};

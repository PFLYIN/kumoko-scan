import { api } from './api'; // Confirme se o caminho da sua API base está correto aqui

// 1. FUNÇÃO DE LOGIN (Que já funcionava)
export const realizarLogin = async (email: string, senha: string) => {
  try {
    const response = await api.post('/login', { email, senha });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Falha na comunicação com o servidor.');
  }
};

// 2. FUNÇÃO DE CADASTRO (A que estava faltando no Mobile!)
export const realizarCadastro = async (nome: string, cpf: string, email: string, senha: string) => {
  try {
    // Comunica com a rota POST /register do backend
    const response = await api.post('/register', { 
      nome, 
      cpf, 
      email, 
      senha 
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error); // Retorna o erro exato do backend (ex: "CPF inválido")
    }
    throw new Error('Não foi possível conectar ao servidor para cadastro.');
  }
};
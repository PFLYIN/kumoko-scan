import { api } from './api';

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

export const realizarCadastro = async (nome: string, cpf: string, email: string, senha: string) => {
  try {
    const response = await api.post('/register', { 
      nome, 
      cpf, 
      email, 
      senha 
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Não foi possível conectar ao servidor para cadastro.');
  }
};
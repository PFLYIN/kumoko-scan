import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Apontando diretamente para o IP da sua máquina no cabo
export const API_URL = 'http://10.0.2.2:3000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

// Interceptador: Se o usuário estiver logado, anexa o JWT (Token) em todas as requisições
api.interceptors.request.use(
  async function(config) {
    const token = await SecureStore.getItemAsync("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function(error) {
    return Promise.reject(error);
  }
);
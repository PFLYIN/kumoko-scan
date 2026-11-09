import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getExpoHost = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  return hostUri?.split(':')[0];
};

export const getApiBaseUrl = () => {
  const host = getExpoHost();

  if (Platform.OS === 'android' && (!host || host === 'localhost' || host === '127.0.0.1')) {
    return 'http://10.0.2.2:3000';
  }

  return `http://${host || 'localhost'}:3000`;
};

export const API_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('usuario');
    }

    return Promise.reject(error);
  }
);
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';

// 1. Pega o IP dinâmico igual fizemos no Login
const getBaseUrl = () => {
  if (Platform.OS === 'android' && !Constants.expoConfig?.hostUri) return 'http://10.0.2.2:3000';
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
  return `http://${localhost}:3000`;
};

// 2. Na hora de formatar a imagem, usamos a sua rota estática '/files' do App.ts
const formatImageUrl = (urlDoBanco) => {
  if (!urlDoBanco) return null; // Imagem padrão caso não tenha capa
  
  // Como o Multer salva o caminho inteiro (ex: C:\...\uploads\covers\img.jpg)
  // Nós pegamos só o nome do arquivo e apontamos pro IP do servidor
  const fileName = urlDoBanco.split('\\').pop().split('/').pop(); 
  return `${getBaseUrl()}/files/covers/${fileName}`;
};
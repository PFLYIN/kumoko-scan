import axios from 'axios';

const api = axios.create({
 baseURL: 'https://kumokoscan.local/api'
});

export default api;
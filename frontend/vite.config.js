import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Em dev, /api e /files sao encaminhados ao gateway Nginx (HTTPS autoassinado).
const proxyTarget = process.env.VITE_DEV_PROXY_TARGET ?? 'https://localhost:8443';

const proxyOptions = {
  target: proxyTarget,
  secure: false,
  changeOrigin: true,
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': proxyOptions,
      '/files': proxyOptions,
    },
  },
  preview: {
    port: 4173,
  },
});

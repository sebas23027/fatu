import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/faturasbomba/api'), // Corrige o caminho
      },
    },
    allowedHosts: [
      '*.ngrok-free.app', // Adiciona o host do ngrok
      '1940-2001-818-de26-c800-cda5-4fa5-b69d-a696.ngrok-free.app', // Permite este subdomínio específico
    ],
  },
});
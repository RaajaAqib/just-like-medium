import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // For GitHub Pages: set base to your repo name
  // e.g. if repo is https://github.com/username/just-like-medium → base: '/just-like-medium/'
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5501',
        changeOrigin: true,
      },
    },
  },
});

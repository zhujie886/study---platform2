import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const base = process.env.BASE_URL || '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});



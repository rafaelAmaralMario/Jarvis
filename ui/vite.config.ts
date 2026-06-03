import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../kernel/resources/webui'),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 1420,
    host: '127.0.0.1',
  },
});

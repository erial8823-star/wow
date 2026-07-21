import { defineConfig } from 'vite';
import { resolve } from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    basicSsl()
  ],
  server: {
    https: true,
    host: true
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'index.js'),
      name: 'FUCharacterExtension',
      fileName: () => 'fu-extension.js',
      formats: ['iife'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
  }
});
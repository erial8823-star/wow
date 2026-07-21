import { defineConfig } from 'vite';
import { resolve } from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    basicSsl()
  ],
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'background.js'),
      output: {
        entryFileNames: 'background.js',
        format: 'iife',
        name: 'FUBackground',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
  },
});
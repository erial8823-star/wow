import { defineConfig } from 'vite';
import { resolve } from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    basicSsl()
  ],
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'background.js'),
        popover: resolve(__dirname, 'popover.js'),
        'full-card': resolve(__dirname, 'full-card.js'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
  },
});
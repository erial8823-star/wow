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
        background: resolve(__dirname, 'background.html'),
        popover: resolve(__dirname, 'popover.html'),
        'full-card': resolve(__dirname, 'full-card.html'),
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
  server: {
    port: 3000,
    https: true,
  },
});
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.js'),  // 只保留 index.js
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
        name: 'FUExtension',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
  },
});
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'background.js'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',   // ✅ 关键：打包成 IIFE 格式
        name: 'FUBackground',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
  },
  server: {
    https: true,
    host: true
  }
});
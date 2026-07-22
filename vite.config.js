import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // 确保打包后的静态资源使用相对路径
  build: {
    rollupOptions: {
      input: {
        background: "background.html",
        popover: "popover.html",
      },
    },
  },
});
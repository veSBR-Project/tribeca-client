import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      process: resolve(__dirname, "node_modules/process/browser.js"),
      stream: resolve(__dirname, "node_modules/stream-browserify"),
      zlib: resolve(__dirname, "node_modules/browserify-zlib"),
      util: resolve(__dirname, "node_modules/util"),
      buffer: resolve(__dirname, "node_modules/buffer"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});

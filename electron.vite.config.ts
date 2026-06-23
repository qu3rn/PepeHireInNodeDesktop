import path from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    entry: "src/main/index.ts",
    build: {
      outDir: "dist/main",
      rollupOptions: {
        external: ["better-sqlite3", "drizzle-orm"]
      }
    },
    resolve: {
      alias: {
        "@shared": path.resolve(__dirname, "src/main/shared")
      }
    }
  },

  preload: {
    entry: "src/preload/index.ts",
    build: {
      outDir: "dist/preload"
    }
  },

  renderer: {
    root: ".",
    entry: "src/renderer/main.tsx",
    build: {
      outDir: "dist/renderer",
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, "index.html")
        }
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@renderer": path.resolve(__dirname, "src/renderer"),
        "@shared": path.resolve(__dirname, "src/main/shared")
      }
    }
  }
});

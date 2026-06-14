import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";

export default defineConfig(() => ({
  plugins: process.env.VITEST
    ? [react()]
    : [
        react(),
        electron({
          main: {
            entry: "electron/main.ts",
          },
          preload: {
            input: "electron/preload.ts",
          },
          renderer: {},
        }),
      ],
  server: {
    port: 5173,
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.{test,spec}.ts", "tests/**/*.{test,spec}.tsx"],
  },
}));

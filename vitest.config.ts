import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const aliasEntries: Record<string, string> = {
  "@": "/src",
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: aliasEntries,
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/test/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["src/test/e2e/**"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/test/**", "src/mcp/index.ts"],
    },
  },
});

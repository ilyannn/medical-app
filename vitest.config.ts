import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// On CI (GitHub Actions sets CI=true), Vitest workers run under Node which cannot
// import bun: built-ins. Alias bun:sqlite to a better-sqlite3 shim so the tests
// can resolve it. Locally, Bun handles bun:sqlite natively so no alias is needed.
const bunSqliteAlias = process.env.CI
  ? { "bun:sqlite": resolve("src/test/mocks/bun-sqlite.ts") }
  : {};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
      ...bunSqliteAlias,
    },
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

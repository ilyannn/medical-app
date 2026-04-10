import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const bunDepMatcher = "bun:sqlite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  test: {
    globals: true,
    environment: "node",
    server: {
      deps: {
        external: [bunDepMatcher],
      },
    },
    deps: {
      optimizer: {
        ssr: {
          exclude: [bunDepMatcher],
        },
      },
    },
    environmentMatchGlobs: [["src/test/web/**", "jsdom"]],
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

import { describe, expect, it } from "vitest";

describe("live integration placeholder", () => {
  it.skipIf(!process.env.PAPERLESS_BASE_URL)(
    "runs only when a real Paperless instance is configured",
    () => {
      expect(process.env.PAPERLESS_BASE_URL).toBeTruthy();
    },
  );
});

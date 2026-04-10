import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("native macOS bridge package", () => {
  it("ships the Swift package scaffold", () => {
    expect(existsSync(path.resolve("native/macos-bridge/Package.swift"))).toBe(
      true,
    );
    expect(
      existsSync(
        path.resolve("native/macos-bridge/Sources/MacOSBridgeCLI/main.swift"),
      ),
    ).toBe(true);
  });
});

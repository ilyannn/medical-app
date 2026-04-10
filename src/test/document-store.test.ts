import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { ICloudDocumentStore } from "@/server/adapters/document-store";
import { createTestRuntime } from "@/test/helpers";
import { describe, expect, it } from "vitest";

describe("ICloudDocumentStore", () => {
  it("creates canonical managed paths per person and year", async () => {
    const { runtime, cleanup } = await createTestRuntime("doc-store");
    const store = new ICloudDocumentStore(runtime.config);

    const relativePath = store.buildRelativePath(
      "me",
      "2026-04-10",
      "Dermatology Visit Summary",
    );

    expect(relativePath).toBe(
      path.join("Me", "2026", "2026-04-10 dermatology visit summary.txt"),
    );
    await cleanup();
  });

  it("ignores unmanaged top-level folders", async () => {
    const { root, runtime, cleanup } =
      await createTestRuntime("managed-folders");
    const store = new ICloudDocumentStore(runtime.config);
    await store.ensureManagedFolders();
    await mkdir(path.join(root, "icloud-root", "Inbox"), { recursive: true });

    const folders = await store.listManagedTopLevelFolders();
    const allFolders = await readdir(path.join(root, "icloud-root"));

    expect(folders.sort()).toEqual(["Me", "Wife"]);
    expect(allFolders).toContain("Inbox");
    await cleanup();
  });
});

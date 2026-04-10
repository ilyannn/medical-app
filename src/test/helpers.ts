import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApiApp, createAppRuntime } from "@/server/app";

export async function createTestRuntime(name: string) {
  const root = await mkdtemp(path.join(tmpdir(), `medical-app-${name}-`));
  const runtime = await createAppRuntime({
    dbPath: path.join(root, "app.sqlite"),
    documentRoot: path.join(root, "icloud-root"),
    personFolderMap: {
      me: "Me",
      wife: "Wife",
    },
    paperless: {
      mode: "fake",
      baseUrl: "",
      token: "",
    },
    macosBridge: {
      mode: "fake",
      binary: "",
      calendarId: "household-medical-demo",
    },
  });

  return {
    root,
    runtime,
    app: createApiApp(runtime),
    cleanup: async () => {
      runtime.sqlite.close();
      await rm(root, { recursive: true, force: true });
    },
  };
}

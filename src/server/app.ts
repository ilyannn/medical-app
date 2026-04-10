import { existsSync } from "node:fs";
import { ICloudDocumentStore } from "@/server/adapters/document-store";
import { createDraftService } from "@/server/adapters/draft-service";
import { createMacOSBridge } from "@/server/adapters/macos-bridge";
import { createPaperlessClient } from "@/server/adapters/paperless";
import { type AppConfig, loadConfig } from "@/server/config";
import {
  type AppDb,
  type DatabaseConnection,
  createDatabase,
} from "@/server/db/client";
import { HouseholdService } from "@/server/services/household-service";
import { seedDemoData } from "@/server/services/seed";
import {
  createAppointmentSchema,
  createBillSchema,
  createDoctorSchema,
  createNoteSchema,
  createPrescriptionSchema,
  createReimbursementSchema,
  generateDraftSchema,
  importPaperlessSchema,
  personScopeSchema,
  renameDocumentSchema,
  searchSchema,
} from "@/shared/types";
import { serveStatic } from "@hono/node-server/serve-static";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";

export interface AppRuntime {
  config: AppConfig;
  db: AppDb;
  sqlite: DatabaseConnection["sqlite"];
  documentStore: ICloudDocumentStore;
  householdService: HouseholdService;
}

export async function createAppRuntime(
  configOverride?: Partial<AppConfig>,
): Promise<AppRuntime> {
  const baseConfig = loadConfig();
  const config = {
    ...baseConfig,
    ...configOverride,
    paperless: {
      ...baseConfig.paperless,
      ...configOverride?.paperless,
    },
    macosBridge: {
      ...baseConfig.macosBridge,
      ...configOverride?.macosBridge,
    },
    ai: {
      ...baseConfig.ai,
      ...configOverride?.ai,
    },
  };
  const { db, sqlite } = await createDatabase(config);
  const documentStore = new ICloudDocumentStore(config);
  const householdService = new HouseholdService(
    db,
    sqlite,
    config,
    documentStore,
    createPaperlessClient(config),
    createMacOSBridge(config),
    createDraftService(config),
  );

  await seedDemoData({ db, documentStore, config });
  await householdService.rebuildSearchIndex();

  return {
    config,
    db,
    sqlite,
    documentStore,
    householdService,
  };
}

export function createApiApp(runtime: AppRuntime) {
  const app = new Hono();
  app.use("*", cors());

  app.get("/api/health", (context) =>
    context.json({
      ok: true,
      mode: runtime.config.macosBridge.mode,
    }),
  );

  app.get("/api/config", (context) =>
    context.json({
      people: Object.entries(runtime.config.personFolderMap).map(
        ([personId, folderName]) => ({
          personId,
          folderName,
        }),
      ),
    }),
  );

  app.get("/api/overview", async (context) => {
    const personScope = personScopeSchema.parse(
      context.req.query("personScope") ?? "all",
    );
    return context.json(
      await runtime.householdService.getOverview(personScope),
    );
  });

  app.get("/api/areas", async (context) => {
    const personScope = personScopeSchema.parse(
      context.req.query("personScope") ?? "all",
    );
    return context.json(await runtime.householdService.listAreas(personScope));
  });

  app.get("/api/doctors", async (context) => {
    const personScope = personScopeSchema.parse(
      context.req.query("personScope") ?? "all",
    );
    return context.json(
      await runtime.householdService.listDoctors(personScope),
    );
  });

  app.post(
    "/api/doctors",
    zValidator("json", createDoctorSchema),
    async (context) =>
      context.json(
        await runtime.householdService.createDoctor(context.req.valid("json")),
        201,
      ),
  );

  app.get("/api/notes", async (context) => {
    const personScope = personScopeSchema.parse(
      context.req.query("personScope") ?? "all",
    );
    return context.json(await runtime.householdService.listNotes(personScope));
  });

  app.post(
    "/api/notes",
    zValidator("json", createNoteSchema),
    async (context) =>
      context.json(
        await runtime.householdService.createNote(context.req.valid("json")),
        201,
      ),
  );

  app.get("/api/prescriptions", async (context) => {
    const personScope = personScopeSchema.parse(
      context.req.query("personScope") ?? "all",
    );
    return context.json(
      await runtime.householdService.listPrescriptions(personScope),
    );
  });

  app.post(
    "/api/prescriptions",
    zValidator("json", createPrescriptionSchema),
    async (context) =>
      context.json(
        await runtime.householdService.createPrescription(
          context.req.valid("json"),
        ),
        201,
      ),
  );

  app.get("/api/bills", async (context) => {
    const personScope = personScopeSchema.parse(
      context.req.query("personScope") ?? "all",
    );
    return context.json(await runtime.householdService.listBills(personScope));
  });

  app.post(
    "/api/bills",
    zValidator("json", createBillSchema),
    async (context) =>
      context.json(
        await runtime.householdService.createBill(context.req.valid("json")),
        201,
      ),
  );

  app.get("/api/reimbursements", async (context) => {
    const personScope = personScopeSchema.parse(
      context.req.query("personScope") ?? "all",
    );
    return context.json(
      await runtime.householdService.listReimbursements(personScope),
    );
  });

  app.post(
    "/api/reimbursements",
    zValidator("json", createReimbursementSchema),
    async (context) =>
      context.json(
        await runtime.householdService.createReimbursement(
          context.req.valid("json"),
        ),
        201,
      ),
  );

  app.get("/api/drafts", async (context) => {
    const personScope = personScopeSchema.parse(
      context.req.query("personScope") ?? "all",
    );
    return context.json(await runtime.householdService.listDrafts(personScope));
  });

  app.post(
    "/api/drafts/generate",
    zValidator("json", generateDraftSchema),
    async (context) =>
      context.json(
        await runtime.householdService.generateDraft(context.req.valid("json")),
        201,
      ),
  );

  app.get("/api/documents", async (context) => {
    const personScope = personScopeSchema.parse(
      context.req.query("personScope") ?? "all",
    );
    return context.json(
      await runtime.householdService.listDocuments(personScope, {
        year: context.req.query("year") ?? undefined,
        documentType: context.req.query("documentType") ?? undefined,
        careAreaId: context.req.query("careAreaId") ?? undefined,
      }),
    );
  });

  app.get("/api/documents/paperless", async (context) =>
    context.json(
      await runtime.householdService.listPaperless(
        context.req.query("query") ?? "",
      ),
    ),
  );

  app.post(
    "/api/documents/import-paperless",
    zValidator("json", importPaperlessSchema),
    async (context) =>
      context.json(
        await runtime.householdService.importPaperlessDocument(
          context.req.valid("json"),
        ),
        201,
      ),
  );

  app.patch(
    "/api/documents/:id",
    zValidator("json", renameDocumentSchema),
    async (context) => {
      const payload = context.req.valid("json");
      return context.json(
        await runtime.householdService.renameDocument(
          context.req.param("id"),
          payload.semanticName,
          payload.documentDate,
        ),
      );
    },
  );

  app.get("/api/appointments", async (context) => {
    const personScope = personScopeSchema.parse(
      context.req.query("personScope") ?? "all",
    );
    return context.json(
      await runtime.householdService.listAppointments(personScope),
    );
  });

  app.post(
    "/api/appointments",
    zValidator("json", createAppointmentSchema),
    async (context) =>
      context.json(
        await runtime.householdService.upsertAppointment(
          context.req.valid("json"),
        ),
        201,
      ),
  );

  app.get("/api/search", async (context) => {
    const payload = searchSchema.parse({
      query: context.req.query("query"),
      personScope: context.req.query("personScope") ?? "all",
    });
    return context.json(
      await runtime.householdService.globalSearch(
        payload.query,
        payload.personScope,
      ),
    );
  });

  if (existsSync("./dist/web")) {
    app.use(
      "*",
      serveStatic({
        root: "./dist/web",
      }),
    );
  }

  return app;
}

let defaultRuntimePromise: Promise<AppRuntime> | null = null;

export function getDefaultRuntime() {
  if (!defaultRuntimePromise) {
    defaultRuntimePromise = createAppRuntime();
  }
  return defaultRuntimePromise;
}

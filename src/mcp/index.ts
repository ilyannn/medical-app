import { getDefaultRuntime } from "@/server/app";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";

const runtime = await getDefaultRuntime();
const householdService = runtime.householdService;

const server = new McpServer({
  name: "open-household-medical-app",
  version: "0.1.0",
});

server.tool(
  "household_overview",
  {
    personScope: z.union([z.literal("all"), z.string().min(1)]).default("all"),
  },
  async ({ personScope }) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          await householdService.getOverview(personScope),
          null,
          2,
        ),
      },
    ],
  }),
);

server.tool(
  "search_records",
  {
    query: z.string().min(1),
    personScope: z.union([z.literal("all"), z.string().min(1)]).default("all"),
  },
  async ({ query, personScope }) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          await householdService.globalSearch(query, personScope),
          null,
          2,
        ),
      },
    ],
  }),
);

server.tool(
  "create_note",
  {
    personId: z.string().min(1),
    careAreaId: z.string().optional(),
    doctorId: z.string().optional(),
    title: z.string().min(2),
    body: z.string().min(2),
    visitDate: z.string().min(10),
    nextStep: z.string().default(""),
  },
  async (payload) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          await householdService.createNote(payload),
          null,
          2,
        ),
      },
    ],
  }),
);

server.tool(
  "create_bill",
  {
    personId: z.string().min(1),
    careAreaId: z.string().optional(),
    doctorId: z.string().optional(),
    label: z.string().min(2),
    amountCents: z.number().int().positive(),
    currency: z.string().length(3).default("EUR"),
    incurredOn: z.string().min(10),
    status: z
      .enum(["new", "submitted", "partially_reimbursed", "reimbursed"])
      .default("new"),
    notes: z.string().default(""),
  },
  async (payload) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          await householdService.createBill(payload),
          null,
          2,
        ),
      },
    ],
  }),
);

server.tool(
  "generate_draft",
  {
    personId: z.string().min(1),
    careAreaId: z.string().optional(),
    doctorId: z.string().optional(),
    intent: z.string().min(2),
    locale: z.enum(["de", "en", "ru"]).default("en"),
    keyFacts: z.array(z.string()).default([]),
  },
  async (payload) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          await householdService.generateDraft(payload),
          null,
          2,
        ),
      },
    ],
  }),
);

server.tool(
  "import_document_from_paperless",
  {
    personId: z.string().min(1),
    careAreaId: z.string().optional(),
    paperlessId: z.string().min(1),
    semanticName: z.string().min(2),
    documentDate: z.string().min(10),
    documentType: z.string().min(2),
    extractedText: z.string().default(""),
    links: z
      .array(
        z.object({
          entityType: z.enum(["bill", "prescription", "note"]),
          entityId: z.string().min(1),
        }),
      )
      .default([]),
  },
  async (payload) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          await householdService.importPaperlessDocument(payload),
          null,
          2,
        ),
      },
    ],
  }),
);

server.tool(
  "upsert_appointment",
  {
    personId: z.string().min(1),
    title: z.string().min(2),
    start: z.string().min(10),
    end: z.string().min(10),
    notes: z.string().default(""),
    externalEventId: z.string().optional(),
    doctorId: z.string().optional(),
    careAreaId: z.string().optional(),
  },
  async (payload) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          await householdService.upsertAppointment(payload),
          null,
          2,
        ),
      },
    ],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);

import path from "node:path";
import * as z from "zod";

const envSchema = z.object({
  APP_PORT: z.coerce.number().default(3001),
  APP_DB_PATH: z.string().default("./var/medical-app.sqlite"),
  ICLOUD_DOCUMENT_ROOT: z.string().default("./demo/icloud-root"),
  PERSON_FOLDER_MAP_JSON: z
    .string()
    .default(JSON.stringify({ me: "Me", wife: "Wife" })),
  PAPERLESS_MODE: z.enum(["fake", "http"]).default("fake"),
  PAPERLESS_BASE_URL: z.string().optional().default(""),
  PAPERLESS_TOKEN: z.string().optional().default(""),
  MACOS_BRIDGE_MODE: z.enum(["fake", "local"]).default("fake"),
  MACOS_BRIDGE_BIN: z.string().optional().default(""),
  MACOS_CALENDAR_ID: z.string().default("household-medical-demo"),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_BASE_URL: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
});

export interface AppConfig {
  port: number;
  dbPath: string;
  documentRoot: string;
  personFolderMap: Record<string, string>;
  paperless: {
    mode: "fake" | "http";
    baseUrl: string;
    token: string;
  };
  macosBridge: {
    mode: "fake" | "local";
    binary: string;
    calendarId: string;
  };
  ai: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
}

export function loadConfig(env = process.env): AppConfig {
  const parsed = envSchema.parse(env);
  const personFolderMap = z
    .record(z.string())
    .parse(JSON.parse(parsed.PERSON_FOLDER_MAP_JSON));

  return {
    port: parsed.APP_PORT,
    dbPath: path.resolve(parsed.APP_DB_PATH),
    documentRoot: path.resolve(parsed.ICLOUD_DOCUMENT_ROOT),
    personFolderMap,
    paperless: {
      mode: parsed.PAPERLESS_MODE,
      baseUrl: parsed.PAPERLESS_BASE_URL,
      token: parsed.PAPERLESS_TOKEN,
    },
    macosBridge: {
      mode: parsed.MACOS_BRIDGE_MODE,
      binary: parsed.MACOS_BRIDGE_BIN,
      calendarId: parsed.MACOS_CALENDAR_ID,
    },
    ai: {
      apiKey: parsed.OPENAI_API_KEY,
      baseUrl: parsed.OPENAI_BASE_URL,
      model: parsed.OPENAI_MODEL,
    },
  };
}

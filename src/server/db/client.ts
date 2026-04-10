import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { AppConfig } from "@/server/config";
import * as schema from "@/server/db/schema";
import { sql } from "@/server/db/sql";
import { drizzle } from "drizzle-orm/bun-sqlite";

export function createDatabase(config: AppConfig) {
  return createDatabaseFromPath(config.dbPath);
}

export function createDatabaseFromPath(dbPath: string) {
  const directory = path.dirname(dbPath);
  return mkdir(directory, { recursive: true }).then(() => {
    const sqlite = new Database(dbPath, { create: true });
    sqlite.exec(sql`PRAGMA foreign_keys = ON;`);
    sqlite.exec(sql`PRAGMA busy_timeout = 5000;`);
    const db = drizzle(sqlite, { schema });
    const migrationSql = readFileSync(
      path.resolve(process.cwd(), "drizzle/0000_initial.sql"),
      "utf8",
    );
    sqlite.exec(migrationSql);
    return { sqlite, db };
  });
}

export type DatabaseConnection = Awaited<
  ReturnType<typeof createDatabaseFromPath>
>;
export type AppDb = DatabaseConnection["db"];

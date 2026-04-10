import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { AppConfig } from "@/server/config";
import * as schema from "@/server/db/schema";
import { sql } from "@/server/db/sql";
import type { SqliteDatabase } from "@/server/db/sqlite";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

export function createDatabase(config: AppConfig) {
  return createDatabaseFromPath(config.dbPath);
}

export type AppDb = BaseSQLiteDatabase<"sync", unknown, typeof schema>;

export interface DatabaseConnection {
  sqlite: SqliteDatabase;
  db: AppDb;
}

export async function createDatabaseFromPath(
  dbPath: string,
): Promise<DatabaseConnection> {
  const directory = path.dirname(dbPath);
  await mkdir(directory, { recursive: true });

  const migrationSql = readFileSync(
    path.resolve(process.cwd(), "drizzle/0000_initial.sql"),
    "utf8",
  );

  if (typeof Bun !== "undefined") {
    const bunSqliteModule = "bun:sqlite";
    const bunDrizzleModule = "drizzle-orm/bun-sqlite";
    const [{ Database }, { drizzle }] = await Promise.all([
      import(bunSqliteModule),
      import(bunDrizzleModule),
    ]);

    const sqlite = new Database(dbPath, { create: true });
    sqlite.exec(sql`PRAGMA foreign_keys = ON;`);
    sqlite.exec(sql`PRAGMA busy_timeout = 5000;`);
    sqlite.exec(migrationSql);

    return {
      sqlite,
      db: drizzle(sqlite, { schema }),
    };
  }

  const betterSqliteModule = "better-sqlite3";
  const betterSqliteDrizzleModule = "drizzle-orm/better-sqlite3";
  const [{ default: Database }, { drizzle }] = await Promise.all([
    import(betterSqliteModule),
    import(betterSqliteDrizzleModule),
  ]);

  const sqlite = new Database(dbPath);
  sqlite.exec(sql`PRAGMA foreign_keys = ON;`);
  sqlite.exec(sql`PRAGMA busy_timeout = 5000;`);
  sqlite.exec(migrationSql);

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
  };
}

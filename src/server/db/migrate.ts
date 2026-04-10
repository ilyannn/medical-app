import { loadConfig } from "@/server/config";
import { createDatabase } from "@/server/db/client";

const config = loadConfig();

await createDatabase(config);
console.log(`Migrated database at ${config.dbPath}`);

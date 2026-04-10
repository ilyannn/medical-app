// Compatibility shim: maps bun:sqlite to better-sqlite3 for Node/Vitest environments.
export { default as Database } from "better-sqlite3";

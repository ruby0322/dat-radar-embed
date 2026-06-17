import Database from "better-sqlite3";

const dbPath = process.env.DB_PATH ?? "../data/dat_radar.db";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(dbPath, { fileMustExist: true, readonly: true });
  return db;
}

import { drizzle, type VercelPgDatabase } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

let _db: VercelPgDatabase<typeof schema> | null = null;

export function getDb(): VercelPgDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(sql, { schema });
  }
  return _db;
}

// Convenience alias — same lazy singleton
export const db = new Proxy({} as VercelPgDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

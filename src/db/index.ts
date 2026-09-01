import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  conn: ReturnType<typeof postgres> | undefined;
  db: Database | undefined;
};

export function getDb(): Database {
  if (globalForDb.db) return globalForDb.db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const local = /localhost|127\.0\.0\.1/.test(url);
  const serverless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const pooled = /pooler|-pool\./i.test(url);

  const conn = postgres(url, {
    max: serverless ? 1 : 10,
    idle_timeout: serverless ? 20 : 0,
    connect_timeout: 30,
    prepare: !pooled,
    ssl: local ? undefined : "require",
  });
  const database = drizzle(conn, { schema });
  globalForDb.conn = conn;
  globalForDb.db = database;
  return database;
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

/**
 * Temporary local fallback when Docker cannot pull postgres:16-alpine.
 * Speaks the same protocol as Docker PostgreSQL on DATABASE_URL.
 * Do not use this as production architecture.
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const pg = new EmbeddedPostgres({
  databaseDir: path.join(process.cwd(), "data", "pg"),
  user: "thekick",
  password: "thekick",
  port: 5432,
  persistent: true,
  authMethod: "scram-sha-256",
});

async function main() {
  const dataDir = path.join(process.cwd(), "data", "pg");
  if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase("thekick");
  } catch {
    // already exists
  }
  console.log("PostgreSQL is running on postgresql://thekick:thekick@localhost:5432/thekick");
  await new Promise(() => undefined);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

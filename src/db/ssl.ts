/** SSL for postgres.js. Internal Docker hosts have no TLS; hosted providers usually require it. */
export function postgresSsl(url: string): "require" | undefined {
  const override = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (override === "disable" || override === "false" || override === "0") {
    return undefined;
  }
  if (override === "require" || override === "true" || override === "1") {
    return "require";
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }

  const sslmode = parsed.searchParams.get("sslmode")?.toLowerCase();
  if (sslmode === "disable" || sslmode === "allow" || sslmode === "prefer") {
    return undefined;
  }
  if (sslmode === "require" || sslmode === "verify-ca" || sslmode === "verify-full") {
    return "require";
  }

  const host = parsed.hostname.toLowerCase();
  const dockerInternal = !host.includes(".");
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || dockerInternal) {
    return undefined;
  }

  return "require";
}

function cleanEnv(raw: string | undefined) {
  if (raw == null) return undefined;
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value || undefined;
}

function parseAbsoluteUrl(value: string, source: string): URL {
  let trimmed = value.trim();
  if (trimmed.startsWith("//")) {
    trimmed = `https:${trimmed}`;
  }
  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : /^(localhost|127\.0\.0\.1)(:|\/|$)/i.test(trimmed)
      ? `http://${trimmed}`
      : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("non-http");
    }
    return url;
  } catch {
    throw new Error(
      `${source} must be a full URL including http:// or https:// (received ${JSON.stringify(value)}). Do not set it to an empty string.`,
    );
  }
}

function isPlaceholderHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "0.0.0.0" ||
    host.includes("replace_with") ||
    host.includes("your_coolify") ||
    host.includes("your-coolify") ||
    host.endsWith(".sslip.io")
  );
}

function usableUrl(value: string, source: string): URL | undefined {
  const url = parseAbsoluteUrl(value, source);
  if (isPlaceholderHost(url.hostname)) return undefined;
  return url;
}

function configuredAuthUrl() {
  return cleanEnv(process.env.AUTH_URL) ?? cleanEnv(process.env.NEXTAUTH_URL);
}

function vercelDeploymentUrl() {
  const env = cleanEnv(process.env.VERCEL_ENV);
  if (env === "preview") {
    return cleanEnv(process.env.VERCEL_BRANCH_URL) ?? cleanEnv(process.env.VERCEL_URL);
  }
  return cleanEnv(process.env.VERCEL_PROJECT_PRODUCTION_URL) ?? cleanEnv(process.env.VERCEL_URL);
}

function netlifyDeploymentUrl() {
  if (!cleanEnv(process.env.NETLIFY)) return undefined;
  return cleanEnv(process.env.URL) ?? cleanEnv(process.env.DEPLOY_PRIME_URL);
}

function coolifyDeploymentUrl() {
  return (
    cleanEnv(process.env.SERVICE_URL_APP_3000) ??
    cleanEnv(process.env.COOLIFY_URL) ??
    cleanEnv(process.env.COOLIFY_FQDN)
  );
}

const PRODUCTION_ORIGIN = "https://kick.smarterp.space";

/** Public origin for metadata. Empty AUTH_URL is treated as unset, never `new URL("")`. */
export function getMetadataBase(): URL | undefined {
  const authUrl = configuredAuthUrl();
  if (authUrl) {
    const parsed = usableUrl(authUrl, "AUTH_URL");
    if (parsed) return parsed;
  }

  const vercelUrl = vercelDeploymentUrl();
  if (vercelUrl) {
    const parsed = usableUrl(vercelUrl, "VERCEL_URL");
    if (parsed) return parsed;
  }

  const netlifyUrl = netlifyDeploymentUrl();
  if (netlifyUrl) {
    const parsed = usableUrl(netlifyUrl, "URL");
    if (parsed) return parsed;
  }

  const coolifyUrl = coolifyDeploymentUrl();
  if (coolifyUrl) {
    const parsed = usableUrl(coolifyUrl, "COOLIFY_URL");
    if (parsed) return parsed;
  }

  return undefined;
}

/**
 * Auth.js calls `new URL(AUTH_URL)` and rewrites request origins from it.
 * Coolify often injects protocol-relative values (`//host.sslip.io`) which
 * crash that parse and break sign-in cookies. Normalize to an origin.
 */
export function ensureAuthUrl(): string | undefined {
  process.env.AUTH_TRUST_HOST = "true";

  const candidates = [configuredAuthUrl(), coolifyDeploymentUrl()];
  for (const raw of candidates) {
    if (!raw) continue;
    try {
      const parsed = usableUrl(raw, "AUTH_URL");
      if (!parsed) continue;
      process.env.AUTH_URL = parsed.origin;
      return parsed.origin;
    } catch (error) {
      console.error("[auth] Ignoring invalid AUTH_URL", error);
    }
  }

  if (process.env.NODE_ENV === "production") {
    process.env.AUTH_URL = PRODUCTION_ORIGIN;
    return PRODUCTION_ORIGIN;
  }

  return undefined;
}

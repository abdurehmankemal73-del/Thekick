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

/** Public origin for metadata. Empty AUTH_URL is treated as unset, never `new URL("")`. */
export function getMetadataBase(): URL | undefined {
  const authUrl = configuredAuthUrl();
  if (authUrl) {
    return parseAbsoluteUrl(authUrl, "AUTH_URL");
  }

  const vercelUrl = vercelDeploymentUrl();
  if (vercelUrl) {
    return parseAbsoluteUrl(vercelUrl, "VERCEL_URL");
  }

  const netlifyUrl = netlifyDeploymentUrl();
  if (netlifyUrl) {
    return parseAbsoluteUrl(netlifyUrl, "URL");
  }

  const coolifyUrl = coolifyDeploymentUrl();
  if (coolifyUrl) {
    return parseAbsoluteUrl(coolifyUrl, "COOLIFY_URL");
  }

  return undefined;
}

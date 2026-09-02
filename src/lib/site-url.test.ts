import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureAuthUrl, getMetadataBase } from "@/lib/site-url";

const KEYS = [
  "AUTH_URL",
  "NEXTAUTH_URL",
  "AUTH_TRUST_HOST",
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_BRANCH_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "NETLIFY",
  "URL",
  "DEPLOY_PRIME_URL",
  "PORT",
  "SERVICE_URL_APP_3000",
  "COOLIFY_URL",
  "COOLIFY_FQDN",
] as const;

describe("getMetadataBase", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    for (const key of KEYS) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses AUTH_URL when it is a full URL", () => {
    vi.stubEnv("AUTH_URL", "https://thekick.example.com");
    expect(getMetadataBase()?.href).toBe("https://thekick.example.com/");
  });

  it("treats Coolify placeholder AUTH_URL as unset", () => {
    vi.stubEnv("AUTH_URL", "https://replace_with_your_coolify_domain");
    expect(getMetadataBase()).toBeUndefined();
  });

  it("treats an empty AUTH_URL as unset instead of calling new URL('')", () => {
    vi.stubEnv("AUTH_URL", "");
    expect(getMetadataBase()).toBeUndefined();
  });

  it("treats whitespace AUTH_URL as unset", () => {
    vi.stubEnv("AUTH_URL", "   ");
    expect(getMetadataBase()).toBeUndefined();
  });

  it("does not use ?? semantics: empty AUTH_URL falls through to Vercel production URL", () => {
    vi.stubEnv("AUTH_URL", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "the-kick-git-main.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "the-kick.vercel.app");
    expect(getMetadataBase()?.href).toBe("https://the-kick.vercel.app/");
  });

  it("uses the preview deployment host on Vercel preview", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_BRANCH_URL", "the-kick-git-feat.vercel.app");
    vi.stubEnv("VERCEL_URL", "the-kick-abc.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "the-kick.vercel.app");
    expect(getMetadataBase()?.href).toBe("https://the-kick-git-feat.vercel.app/");
  });

  it("accepts a Vercel host without a protocol", () => {
    vi.stubEnv("AUTH_URL", "the-kick.vercel.app");
    expect(getMetadataBase()?.href).toBe("https://the-kick.vercel.app/");
  });

  it("prefers AUTH_URL over Vercel system URLs", () => {
    vi.stubEnv("AUTH_URL", "https://club.example.com");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "the-kick.vercel.app");
    expect(getMetadataBase()?.href).toBe("https://club.example.com/");
  });

  it("uses Netlify URL when AUTH_URL is missing on Netlify", () => {
    vi.stubEnv("NETLIFY", "true");
    vi.stubEnv("URL", "https://thekick.netlify.app");
    expect(getMetadataBase()?.href).toBe("https://thekick.netlify.app/");
  });

  it("rejects an invalid AUTH_URL with a clear error", () => {
    vi.stubEnv("AUTH_URL", "://bad");
    expect(() => getMetadataBase()).toThrow(/AUTH_URL must be a full URL/);
  });

  it("accepts Coolify protocol-relative URLs", () => {
    vi.stubEnv("COOLIFY_URL", "//app.13.140.149.168.sslip.io");
    expect(getMetadataBase()?.href).toBe("https://app.13.140.149.168.sslip.io/");
  });

  it("uses SERVICE_URL_APP_3000 from Coolify Compose", () => {
    vi.stubEnv("SERVICE_URL_APP_3000", "https://kick.smarterp.space");
    expect(getMetadataBase()?.href).toBe("https://kick.smarterp.space/");
  });
});

describe("ensureAuthUrl", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    for (const key of KEYS) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rewrites protocol-relative AUTH_URL so Auth.js can parse it", () => {
    vi.stubEnv("AUTH_URL", "//kick.smarterp.space");
    expect(ensureAuthUrl()).toBe("https://kick.smarterp.space");
    expect(process.env.AUTH_URL).toBe("https://kick.smarterp.space");
  });

  it("strips a path from AUTH_URL down to the origin", () => {
    vi.stubEnv("AUTH_URL", "https://kick.smarterp.space/api/auth");
    expect(ensureAuthUrl()).toBe("https://kick.smarterp.space");
  });

  it("uses Coolify SERVICE_URL when AUTH_URL is missing", () => {
    vi.stubEnv("SERVICE_URL_APP_3000", "https://kick.smarterp.space");
    expect(ensureAuthUrl()).toBe("https://kick.smarterp.space");
  });

  it("ignores placeholder AUTH_URL and uses the Coolify public origin", () => {
    vi.stubEnv("AUTH_URL", "https://replace_with_your_coolify_domain");
    vi.stubEnv("SERVICE_URL_APP_3000", "https://kick.smarterp.space");
    expect(ensureAuthUrl()).toBe("https://kick.smarterp.space");
  });

  it("falls back to the production origin when AUTH_URL is a Coolify placeholder", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_URL", "https://replace_with_your_coolify_domain");
    expect(ensureAuthUrl()).toBe("https://kick.smarterp.space");
  });

  it("falls back to the production origin when AUTH_URL is invalid", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_URL", "://bad");
    expect(ensureAuthUrl()).toBe("https://kick.smarterp.space");
  });
});

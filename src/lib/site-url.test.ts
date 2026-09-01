import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMetadataBase } from "@/lib/site-url";

const KEYS = [
  "AUTH_URL",
  "NEXTAUTH_URL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_BRANCH_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "NETLIFY",
  "URL",
  "DEPLOY_PRIME_URL",
  "PORT",
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
});

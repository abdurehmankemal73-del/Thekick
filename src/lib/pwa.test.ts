import { describe, expect, it } from "vitest";
import { clubWebManifest, PWA_BOOTSTRAP_SCRIPT } from "@/lib/pwa";

describe("club web manifest", () => {
  it("includes the fields browsers need to offer install", () => {
    const manifest = clubWebManifest();
    expect(manifest.name).toContain("THE KICK");
    expect(manifest.short_name).toBe("THE KICK");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#c8102e");
    expect(manifest.background_color).toBe("#0b0b0c");
    expect(manifest.prefer_related_applications).toBe(false);
    const icons = manifest.icons ?? [];
    expect(icons.some((icon) => icon.sizes === "192x192" && icon.type === "image/png")).toBe(true);
    expect(icons.some((icon) => icon.sizes === "512x512" && icon.type === "image/png")).toBe(true);
    expect(icons.some((icon) => icon.purpose === "maskable")).toBe(true);
  });

  it("captures the Chrome install event before React hydrates", () => {
    expect(PWA_BOOTSTRAP_SCRIPT).toContain("beforeinstallprompt");
    expect(PWA_BOOTSTRAP_SCRIPT).toContain("/sw.js");
    expect(PWA_BOOTSTRAP_SCRIPT).toContain('scope: "/"');
  });
});

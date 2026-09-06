import { describe, expect, it } from "vitest";
import { clubWebManifest } from "@/lib/pwa";

describe("club web manifest", () => {
  it("includes the fields browsers need to offer install", () => {
    const manifest = clubWebManifest();
    expect(manifest.name).toContain("THE KICK");
    expect(manifest.short_name).toBe("THE KICK");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    const icons = manifest.icons ?? [];
    expect(icons.some((icon) => icon.sizes === "192x192" && icon.type === "image/png")).toBe(true);
    expect(icons.some((icon) => icon.sizes === "512x512" && icon.type === "image/png")).toBe(true);
    expect(icons.some((icon) => icon.purpose === "maskable")).toBe(true);
  });
});

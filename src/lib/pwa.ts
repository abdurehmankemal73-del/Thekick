import type { MetadataRoute } from "next";
import { CLUB } from "@/lib/constants";

export const PWA_THEME_COLOR = "#c8102e";
export const PWA_BACKGROUND_COLOR = "#0b0b0c";

export function clubWebManifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: CLUB.fullName,
    short_name: CLUB.shortName,
    description: `${CLUB.fullName} — ${CLUB.federation}. Discipline, strength, respect.`,
    start_url: "/",
    scope: "/",
    display: "standalone" as const,
    display_override: ["standalone", "browser"],
    orientation: "any" as const,
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    lang: "en",
    dir: "ltr" as const,
    categories: ["sports", "education"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "News", short_name: "News", url: "/news", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Calendar", short_name: "Calendar", url: "/calendar", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Sign in", short_name: "Sign in", url: "/login", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}

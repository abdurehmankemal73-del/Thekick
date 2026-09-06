import type { MetadataRoute } from "next";
import { CLUB } from "@/lib/constants";

export const PWA_THEME_COLOR = "#c8102e";
export const PWA_BACKGROUND_COLOR = "#0b0b0c";

export const PWA_BOOTSTRAP_SCRIPT = `(function(){
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", function(event) {
    event.preventDefault();
    window.__THE_KICK_DEFERRED_PROMPT = event;
    window.dispatchEvent(new Event("thekick-bip"));
  });
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", function() {
    var ok = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if (!ok) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(function() {});
  });
})();`;

export function clubWebManifest(): MetadataRoute.Manifest {
  return {
    id: "the-kick",
    name: CLUB.fullName,
    short_name: CLUB.shortName,
    description: `${CLUB.fullName} — ${CLUB.federation}. Discipline, strength, respect.`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    lang: "en",
    dir: "ltr",
    prefer_related_applications: false,
    categories: ["sports", "education"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
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

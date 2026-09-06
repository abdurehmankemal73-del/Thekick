import type { MetadataRoute } from "next";
import { clubWebManifest } from "@/lib/pwa";

export default function manifest(): MetadataRoute.Manifest {
  return clubWebManifest();
}

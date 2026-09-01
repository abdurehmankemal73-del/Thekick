import type { Metadata } from "next";
import { CLUB } from "@/lib/constants";
import { getClubSettings } from "@/lib/queries";
import { AboutView } from "./about-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description: `About ${CLUB.fullName}.`,
};

export default async function AboutPage() {
  let settings = null;
  try {
    settings = await getClubSettings();
  } catch {
    settings = null;
  }

  return <AboutView settings={settings} />;
}

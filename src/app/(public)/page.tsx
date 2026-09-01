import type { Metadata } from "next";
import { CLUB } from "@/lib/constants";
import { getClubSettings, getPublishedAnnouncements } from "@/lib/queries";
import { HomeView } from "./home-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home",
  description: `${CLUB.fullName} — ${CLUB.federation}.`,
};

export default async function HomePage() {
  let settings = null;
  let announcements: Awaited<ReturnType<typeof getPublishedAnnouncements>> = [];
  try {
    [settings, announcements] = await Promise.all([
      getClubSettings(),
      getPublishedAnnouncements(3),
    ]);
  } catch {
    settings = null;
  }

  return (
    <HomeView
      settings={settings}
      announcements={announcements.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        createdAt: item.createdAt,
      }))}
    />
  );
}

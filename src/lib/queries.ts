import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements, clubSettings } from "@/db/schema";
import { DEFAULT_CLUB_SETTINGS } from "@/lib/constants";

export async function getClubSettings() {
  const [row] = await db
    .select()
    .from(clubSettings)
    .where(eq(clubSettings.id, "default"))
    .limit(1);
  return row ?? { id: "default", ...DEFAULT_CLUB_SETTINGS, updatedAt: new Date() };
}

export async function getPublishedAnnouncements(limit = 6) {
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      imageUrl: announcements.imageUrl,
      publishedAt: announcements.publishedAt,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .where(eq(announcements.status, "PUBLISHED"))
    .orderBy(desc(announcements.publishedAt), desc(announcements.createdAt))
    .limit(limit);
}

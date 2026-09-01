import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { announcementImages, announcements, users } from "@/db/schema";

export async function syncAnnouncementImages(announcementId: string, urls: string[]) {
  await db.delete(announcementImages).where(eq(announcementImages.announcementId, announcementId));
  const clean = urls.map((url) => url.trim()).filter(Boolean);
  if (clean.length === 0) return [];
  await db.insert(announcementImages).values(
    clean.map((url, index) => ({
      announcementId,
      url,
      sortOrder: index,
    })),
  );
  return clean;
}

export async function imagesFor(announcementId: string) {
  return db
    .select({
      id: announcementImages.id,
      url: announcementImages.url,
      sortOrder: announcementImages.sortOrder,
    })
    .from(announcementImages)
    .where(eq(announcementImages.announcementId, announcementId))
    .orderBy(asc(announcementImages.sortOrder));
}

export async function announcementWithMeta(id: string) {
  const [row] = await db
    .select({
      announcement: announcements,
      authorName: users.fullName,
    })
    .from(announcements)
    .innerJoin(users, eq(announcements.authorId, users.id))
    .where(eq(announcements.id, id))
    .limit(1);
  if (!row) return null;
  const extraImages = await imagesFor(id);
  return {
    ...row.announcement,
    authorName: row.authorName,
    extraImages,
  };
}

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements, users } from "@/db/schema";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { announcementSchema } from "@/lib/validations";
import { writeAudit } from "@/lib/audit";
import { announcementWithMeta, imagesFor, syncAnnouncementImages } from "@/lib/news";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db
      .select({
        announcement: announcements,
        authorName: users.fullName,
      })
      .from(announcements)
      .innerJoin(users, eq(announcements.authorId, users.id))
      .orderBy(desc(announcements.createdAt));

    const items = await Promise.all(
      rows.map(async (row) => ({
        ...row.announcement,
        authorName: row.authorName,
        extraImages: await imagesFor(row.announcement.id),
      })),
    );
    return json({ announcements: items });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await readJson<unknown>(request);
    const data = announcementSchema.parse(body);
    const publishedAt =
      data.status === "PUBLISHED"
        ? data.publishedAt
          ? new Date(data.publishedAt)
          : new Date()
        : null;

    const [created] = await db
      .insert(announcements)
      .values({
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl || null,
        status: data.status,
        publishedAt,
        authorId: admin.id,
      })
      .returning();

    await syncAnnouncementImages(created.id, data.extraImageUrls ?? []);
    await writeAudit({
      actorId: admin.id,
      action: "ANNOUNCEMENT_CREATE",
      targetType: "announcement",
      targetId: created.id,
    });

    const announcement =
      (await announcementWithMeta(created.id)) ?? {
        ...created,
        authorName: admin.fullName,
        extraImages: [],
      };

    return json({ announcement }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

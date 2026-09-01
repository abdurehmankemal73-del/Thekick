import { eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { errorResponse, json, readJson, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { announcementSchema } from "@/lib/validations";
import { writeAudit } from "@/lib/audit";
import { announcementWithMeta, syncAnnouncementImages } from "@/lib/news";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await readJson<unknown>(request);
    const data = announcementSchema.partial().parse(body);

    const [existing] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);
    if (!existing) throw new HttpError(404, "Announcement not found");

    const nextStatus = data.status ?? existing.status;
    let publishedAt = existing.publishedAt;
    if (nextStatus === "PUBLISHED") {
      publishedAt = data.publishedAt
        ? new Date(data.publishedAt)
        : existing.publishedAt ?? new Date();
    } else if (data.status === "DRAFT") {
      publishedAt = existing.publishedAt;
    }

    await db
      .update(announcements)
      .set({
        ...(data.title ? { title: data.title } : {}),
        ...(data.content ? { content: data.content } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
        ...(data.status ? { status: data.status } : {}),
        publishedAt,
      })
      .where(eq(announcements.id, id));

    if (data.extraImageUrls) {
      await syncAnnouncementImages(id, data.extraImageUrls);
    }

    await writeAudit({
      actorId: admin.id,
      action: "ANNOUNCEMENT_UPDATE",
      targetType: "announcement",
      targetId: id,
    });

    return json({ announcement: await announcementWithMeta(id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const [existing] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);
    if (!existing) throw new HttpError(404, "Announcement not found");

    await db.delete(announcements).where(eq(announcements.id, id));
    await writeAudit({
      actorId: admin.id,
      action: "ANNOUNCEMENT_DELETE",
      targetType: "announcement",
      targetId: id,
    });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

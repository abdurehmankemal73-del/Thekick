import { eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { errorResponse, json, readJson, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { calendarEventSchema } from "@/lib/validations";
import { writeAudit } from "@/lib/audit";
import { combineDateAndTime } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await readJson<unknown>(request);
    const data = calendarEventSchema.parse(body);
    const [existing] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id)).limit(1);
    if (!existing) throw new HttpError(404, "Event not found");

    const startsAt = combineDateAndTime(data.date, data.startTime, data.allDay);
    const endsAt = data.endTime ? combineDateAndTime(data.date, data.endTime, false) : null;

    const [updated] = await db
      .update(calendarEvents)
      .set({
        title: data.title,
        description: data.description,
        eventType: data.eventType,
        startsAt,
        endsAt,
        allDay: data.allDay,
        location: data.location || null,
        status: data.status,
      })
      .where(eq(calendarEvents.id, id))
      .returning();

    await writeAudit({
      actorId: admin.id,
      action: "EVENT_UPDATE",
      targetType: "calendar_event",
      targetId: id,
    });

    return json({ event: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const [existing] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id)).limit(1);
    if (!existing) throw new HttpError(404, "Event not found");

    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    await writeAudit({
      actorId: admin.id,
      action: "EVENT_DELETE",
      targetType: "calendar_event",
      targetId: id,
    });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

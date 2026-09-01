import { asc } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { calendarEventSchema } from "@/lib/validations";
import { writeAudit } from "@/lib/audit";
import { combineDateAndTime } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.select().from(calendarEvents).orderBy(asc(calendarEvents.startsAt));
    return json({ events: rows });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await readJson<unknown>(request);
    const data = calendarEventSchema.parse(body);
    const startsAt = combineDateAndTime(data.date, data.startTime, data.allDay);
    const endsAt = data.endTime ? combineDateAndTime(data.date, data.endTime, false) : null;

    const [created] = await db
      .insert(calendarEvents)
      .values({
        title: data.title,
        description: data.description,
        eventType: data.eventType,
        startsAt,
        endsAt,
        allDay: data.allDay,
        location: data.location || null,
        status: data.status,
        createdById: admin.id,
      })
      .returning();

    await writeAudit({
      actorId: admin.id,
      action: "EVENT_CREATE",
      targetType: "calendar_event",
      targetId: created.id,
    });

    return json({ event: created }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

import { and, asc, eq, gte } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { errorResponse, json } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const upcoming = request.nextUrl.searchParams.get("upcoming") === "1";
    const filters = [eq(calendarEvents.status, "PUBLISHED")];
    if (upcoming) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      filters.push(gte(calendarEvents.startsAt, startOfToday));
    }

    const rows = await db
      .select({
        id: calendarEvents.id,
        title: calendarEvents.title,
        description: calendarEvents.description,
        eventType: calendarEvents.eventType,
        startsAt: calendarEvents.startsAt,
        endsAt: calendarEvents.endsAt,
        allDay: calendarEvents.allDay,
        location: calendarEvents.location,
        status: calendarEvents.status,
      })
      .from(calendarEvents)
      .where(and(...filters))
      .orderBy(asc(calendarEvents.startsAt));

    return json({ events: rows });
  } catch (error) {
    return errorResponse(error);
  }
}

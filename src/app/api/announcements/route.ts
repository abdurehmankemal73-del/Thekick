import { desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { announcements, users } from "@/db/schema";
import { errorResponse, json } from "@/lib/http";
import { imagesFor } from "@/lib/news";

export async function GET(request: NextRequest) {
  try {
    const limit = Math.min(
      20,
      Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 6) || 6),
    );
    const rows = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        imageUrl: announcements.imageUrl,
        publishedAt: announcements.publishedAt,
        createdAt: announcements.createdAt,
        authorName: users.fullName,
      })
      .from(announcements)
      .innerJoin(users, eq(announcements.authorId, users.id))
      .where(eq(announcements.status, "PUBLISHED"))
      .orderBy(desc(announcements.publishedAt), desc(announcements.createdAt))
      .limit(limit);

    const items = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        extraImages: await imagesFor(row.id),
      })),
    );
    return json({ announcements: items });
  } catch (error) {
    return errorResponse(error);
  }
}

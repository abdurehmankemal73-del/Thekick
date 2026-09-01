import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { errorResponse, json } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { adminStudent } from "@/lib/dtos";
import { parsePage, searchParam } from "@/lib/pagination";
import type { AccountStatus, BeltLevel } from "@/db/schema";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { page, pageSize, offset } = parsePage(request);
    const q = searchParam(request, "q");
    const belt = searchParam(request, "belt") as BeltLevel | undefined;
    const status = searchParam(request, "status") as AccountStatus | undefined;

    const filters = [eq(users.role, "STUDENT")];
    if (q) {
      filters.push(
        or(
          ilike(users.fullName, `%${q}%`),
          ilike(users.email, `%${q}%`),
          ilike(users.telegramUsername, `%${q}%`),
        )!,
      );
    }
    if (belt) filters.push(eq(users.beltLevel, belt));
    if (status) filters.push(eq(users.accountStatus, status));

    const where = and(...filters);

    const [totalRow] = await db.select({ n: count() }).from(users).where(where);
    const rows = await db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset);

    return json({
      students: rows.map(adminStudent),
      page,
      pageSize,
      total: Number(totalRow.n),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

import { count, desc } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { errorResponse, json } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { adminStudent } from "@/lib/dtos";
import { parsePage, searchParam } from "@/lib/pagination";
import { studentWhere } from "@/lib/student-query";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { page, pageSize, offset } = parsePage(request);

    const where = studentWhere({
      q: searchParam(request, "q"),
      belt: searchParam(request, "belt"),
      status: searchParam(request, "status"),
    });

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

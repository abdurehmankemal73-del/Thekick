import { and, desc, eq, ilike, or } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { permissionRequests, users } from "@/db/schema";
import { errorResponse, json } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { parsePage, searchParam } from "@/lib/pagination";
import type { AbsenceType } from "@/db/schema";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { page, pageSize, offset } = parsePage(request);
    const q = searchParam(request, "q");
    const status = searchParam(request, "status");
    const absenceType = searchParam(request, "absenceType") as AbsenceType | undefined;

    const filters = [];
    if (q) {
      filters.push(
        or(ilike(users.fullName, `%${q}%`), ilike(permissionRequests.reason, `%${q}%`))!,
      );
    }
    if (status === "PENDING" || status === "APPROVED" || status === "REJECTED") {
      filters.push(eq(permissionRequests.status, status));
    }
    if (absenceType) filters.push(eq(permissionRequests.absenceType, absenceType));

    const where = filters.length ? and(...filters) : undefined;

    const rows = await db
      .select({
        permission: permissionRequests,
        studentName: users.fullName,
        studentBelt: users.beltLevel,
        studentEmail: users.email,
      })
      .from(permissionRequests)
      .innerJoin(users, eq(permissionRequests.studentId, users.id))
      .where(where)
      .orderBy(desc(permissionRequests.createdAt))
      .limit(pageSize)
      .offset(offset);

    return json({
      permissions: rows.map((row) => ({
        ...row.permission,
        studentName: row.studentName,
        studentBelt: row.studentBelt,
        studentEmail: row.studentEmail,
      })),
      page,
      pageSize,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

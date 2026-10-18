import { asc } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { errorResponse } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { searchParam } from "@/lib/pagination";
import { studentWhere } from "@/lib/student-query";
import {
  buildStudentRosterPdf,
  sortRosterStudents,
  type RosterStudent,
} from "@/lib/student-roster-pdf";
import { isLocale, type Locale } from "@/i18n/messages";

/** Admin-only roster export: active students, name, belt level and status, as a PDF. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    // The printed roster always lists active students only; the on-screen
    // status filter is intentionally ignored (search and belt still apply).
    const where = studentWhere({
      q: searchParam(request, "q"),
      belt: searchParam(request, "belt"),
      status: "ACTIVE",
    });

    const rows = await db
      .select({ fullName: users.fullName, beltLevel: users.beltLevel, accountStatus: users.accountStatus })
      .from(users)
      .where(where)
      .orderBy(asc(users.fullName));

    const students: RosterStudent[] = sortRosterStudents(
      rows.map((row) => ({
        fullName: row.fullName,
        beltLevel: row.beltLevel,
        accountStatus: row.accountStatus,
      })),
    );

    const lang = searchParam(request, "lang");
    const locale: Locale = isLocale(lang) ? lang : "en";

    const pdf = await buildStudentRosterPdf(students, { locale });
    const stamp = new Date().toISOString().slice(0, 10);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="the-kick-students-${stamp}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

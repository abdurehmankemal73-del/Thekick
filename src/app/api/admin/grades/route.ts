import { and, desc, eq, ilike, or } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { grades, users } from "@/db/schema";
import { errorResponse, json, readJson, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { gradeSchema } from "@/lib/validations";
import { parsePage, searchParam } from "@/lib/pagination";
import { writeAudit } from "@/lib/audit";
import type { BeltLevel } from "@/db/schema";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { page, pageSize, offset } = parsePage(request);
    const q = searchParam(request, "q");
    const belt = searchParam(request, "belt") as BeltLevel | undefined;
    const assessment = searchParam(request, "assessment");

    const filters = [];
    if (q) {
      filters.push(
        or(ilike(users.fullName, `%${q}%`), ilike(users.email, `%${q}%`))!,
      );
    }
    if (belt) filters.push(eq(users.beltLevel, belt));
    if (assessment) filters.push(ilike(grades.assessmentName, `%${assessment}%`));

    const where = filters.length ? and(...filters) : undefined;

    const rows = await db
      .select({
        grade: grades,
        studentName: users.fullName,
        studentBelt: users.beltLevel,
        studentEmail: users.email,
      })
      .from(grades)
      .innerJoin(users, eq(grades.studentId, users.id))
      .where(where)
      .orderBy(desc(grades.assessmentDate))
      .limit(pageSize)
      .offset(offset);

    return json({
      grades: rows.map((row) => ({
        ...row.grade,
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

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await readJson<unknown>(request);
    const data = gradeSchema.parse(body);

    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, data.studentId))
      .limit(1);
    if (!student || student.role !== "STUDENT") {
      throw new HttpError(404, "Student not found");
    }

    const [created] = await db
      .insert(grades)
      .values({
        studentId: data.studentId,
        assessmentName: data.assessmentName,
        patternScore: data.patternScore ?? null,
        sparringScore: data.sparringScore ?? null,
        kicksScore: data.kicksScore ?? null,
        theoryScore: data.theoryScore ?? null,
        disciplineScore: data.disciplineScore ?? null,
        overallScore: data.overallScore ?? null,
        result: data.result || null,
        instructorComment: data.instructorComment || null,
        assessmentDate: new Date(data.assessmentDate),
      })
      .returning();

    await writeAudit({
      actorId: admin.id,
      action: "GRADE_CREATE",
      targetType: "grade",
      targetId: created.id,
      metadata: { studentId: data.studentId },
    });

    return json({ grade: created }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { grades, users } from "@/db/schema";
import { errorResponse, json, readJson, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { gradeSchema } from "@/lib/validations";
import { writeAudit } from "@/lib/audit";
import { applyGradeScores } from "@/lib/grades";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await readJson<unknown>(request);
    const data = gradeSchema.partial().parse(body);

    const [existing] = await db.select().from(grades).where(eq(grades.id, id)).limit(1);
    if (!existing) throw new HttpError(404, "Grade not found");

    if (data.studentId && data.studentId !== existing.studentId) {
      const [student] = await db.select().from(users).where(eq(users.id, data.studentId)).limit(1);
      if (!student || student.role !== "STUDENT") {
        throw new HttpError(404, "Student not found");
      }
    }

    const scores = applyGradeScores(existing, data);
    const [updated] = await db
      .update(grades)
      .set({
        ...(data.studentId ? { studentId: data.studentId } : {}),
        ...(data.assessmentName ? { assessmentName: data.assessmentName } : {}),
        ...scores,
        ...(data.result !== undefined ? { result: data.result || null } : {}),
        ...(data.instructorComment !== undefined
          ? { instructorComment: data.instructorComment || null }
          : {}),
        ...(data.assessmentDate ? { assessmentDate: new Date(data.assessmentDate) } : {}),
      })
      .where(eq(grades.id, id))
      .returning();

    await writeAudit({
      actorId: admin.id,
      action: "GRADE_UPDATE",
      targetType: "grade",
      targetId: id,
    });

    return json({ grade: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const [existing] = await db.select().from(grades).where(eq(grades.id, id)).limit(1);
    if (!existing) throw new HttpError(404, "Grade not found");

    await db.delete(grades).where(eq(grades.id, id));
    await writeAudit({
      actorId: admin.id,
      action: "GRADE_DELETE",
      targetType: "grade",
      targetId: id,
    });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

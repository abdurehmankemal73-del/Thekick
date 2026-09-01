import { eq } from "drizzle-orm";
import { db } from "@/db";
import { grades } from "@/db/schema";
import { errorResponse, json, readJson, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { gradeSchema } from "@/lib/validations";
import { writeAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await readJson<unknown>(request);
    const data = gradeSchema.partial().parse(body);

    const [existing] = await db.select().from(grades).where(eq(grades.id, id)).limit(1);
    if (!existing) throw new HttpError(404, "Grade not found");

    const [updated] = await db
      .update(grades)
      .set({
        ...(data.assessmentName ? { assessmentName: data.assessmentName } : {}),
        ...(data.patternScore !== undefined ? { patternScore: data.patternScore ?? null } : {}),
        ...(data.sparringScore !== undefined ? { sparringScore: data.sparringScore ?? null } : {}),
        ...(data.kicksScore !== undefined ? { kicksScore: data.kicksScore ?? null } : {}),
        ...(data.theoryScore !== undefined ? { theoryScore: data.theoryScore ?? null } : {}),
        ...(data.disciplineScore !== undefined
          ? { disciplineScore: data.disciplineScore ?? null }
          : {}),
        ...(data.overallScore !== undefined ? { overallScore: data.overallScore ?? null } : {}),
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

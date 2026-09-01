import { eq } from "drizzle-orm";
import { db } from "@/db";
import { beltHistory, users } from "@/db/schema";
import { errorResponse, json, readJson, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { adminStudentUpdateSchema } from "@/lib/validations";
import { adminStudent } from "@/lib/dtos";
import { writeAudit } from "@/lib/audit";
import { approveStudent, rejectStudent } from "@/lib/students";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const [student] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!student || student.role !== "STUDENT") {
      throw new HttpError(404, "Student not found");
    }
    return json({ student: adminStudent(student) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await readJson<unknown>(request);
    const data = adminStudentUpdateSchema.parse(body);

    const [student] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!student || student.role !== "STUDENT") {
      throw new HttpError(404, "Student not found");
    }

    if (data.beltLevel && data.beltLevel !== student.beltLevel) {
      await db.insert(beltHistory).values({
        studentId: student.id,
        fromBelt: student.beltLevel,
        toBelt: data.beltLevel,
        changedById: admin.id,
      });
      await writeAudit({
        actorId: admin.id,
        action: "BELT_CHANGE",
        targetType: "user",
        targetId: student.id,
        metadata: { from: student.beltLevel, to: data.beltLevel },
      });
    }

    if (data.accountStatus === "ACTIVE" && student.accountStatus !== "ACTIVE") {
      const result = await approveStudent(admin, student.id);
      const extra = {
        ...(data.fullName ? { fullName: data.fullName, name: data.fullName } : {}),
        ...(data.telegramUsername ? { telegramUsername: data.telegramUsername } : {}),
        ...(data.beltLevel ? { beltLevel: data.beltLevel } : {}),
      };
      if (Object.keys(extra).length > 0 && result.student) {
        const [updated] = await db.update(users).set(extra).where(eq(users.id, student.id)).returning();
        return json({
          student: adminStudent(updated),
          emailSent: Boolean(updated.approvalEmailSentAt),
          message: "Student approved and notification email sent.",
        });
      }
      return json({
        student: adminStudent(result.student),
        emailSent: Boolean(result.student.approvalEmailSentAt),
        message: result.alreadyApproved
          ? "This student was already approved."
          : "Student approved and notification email sent.",
      });
    }

    if (data.accountStatus === "REJECTED" && student.accountStatus !== "REJECTED") {
      const updated = await rejectStudent(admin, student.id);
      return json({ student: adminStudent(updated), message: "Registration rejected." });
    }

    if (data.accountStatus && data.accountStatus !== student.accountStatus) {
      await writeAudit({
        actorId: admin.id,
        action: "STUDENT_STATUS_CHANGE",
        targetType: "user",
        targetId: student.id,
        metadata: { from: student.accountStatus, to: data.accountStatus },
      });
    }

    const [updated] = await db
      .update(users)
      .set({
        ...(data.fullName ? { fullName: data.fullName, name: data.fullName } : {}),
        ...(data.telegramUsername ? { telegramUsername: data.telegramUsername } : {}),
        ...(data.beltLevel ? { beltLevel: data.beltLevel } : {}),
        ...(data.accountStatus ? { accountStatus: data.accountStatus } : {}),
      })
      .where(eq(users.id, id))
      .returning();

    return json({ student: adminStudent(updated) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const [student] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!student || student.role !== "STUDENT") {
      throw new HttpError(404, "Student not found");
    }

    await writeAudit({
      actorId: admin.id,
      action: "STUDENT_DELETE",
      targetType: "user",
      targetId: student.id,
      metadata: { email: student.email, fullName: student.fullName },
    });

    await db.delete(users).where(eq(users.id, id));
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

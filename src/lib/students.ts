import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { HttpError } from "@/lib/http";
import { approvalEmail, MailError, sendMail } from "@/lib/mail";

export async function approveStudent(admin: User, studentId: string) {
  const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
  if (!student || student.role !== "STUDENT") {
    throw new HttpError(404, "Student not found");
  }
  if (student.accountStatus === "ACTIVE" && student.approvalEmailSentAt) {
    return { student, alreadyApproved: true as const, previewUrl: undefined };
  }
  if (student.accountStatus === "REJECTED") {
    throw new HttpError(400, "This registration was rejected. Edit the student to restore it first.");
  }

  let messageId: string;
  let previewUrl: string | undefined;
  try {
    const email = approvalEmail(student.fullName);
    const result = await sendMail({
      to: student.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    messageId = result.messageId;
    previewUrl = result.previewUrl;
  } catch (error) {
    const message =
      error instanceof MailError
        ? error.message
        : "Approval email could not be sent. The student was not approved.";
    console.error("Approval email failed", {
      studentId: student.id,
      email: student.email,
      error,
    });
    throw new HttpError(502, message);
  }

  const now = new Date();
  const [updated] = await db
    .update(users)
    .set({
      accountStatus: "ACTIVE",
      approvedAt: now,
      approvalEmailSentAt: now,
      rejectedAt: null,
    })
    .where(eq(users.id, student.id))
    .returning();

  await writeAudit({
    actorId: admin.id,
    action: "STUDENT_APPROVE",
    targetType: "user",
    targetId: student.id,
    metadata: { email: student.email, messageId },
  });

  return { student: updated, alreadyApproved: false as const, messageId, previewUrl };
}

export async function rejectStudent(admin: User, studentId: string) {
  const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
  if (!student || student.role !== "STUDENT") {
    throw new HttpError(404, "Student not found");
  }
  if (student.accountStatus === "REJECTED") {
    return student;
  }

  const [updated] = await db
    .update(users)
    .set({
      accountStatus: "REJECTED",
      rejectedAt: new Date(),
    })
    .where(eq(users.id, student.id))
    .returning();

  await writeAudit({
    actorId: admin.id,
    action: "STUDENT_REJECT",
    targetType: "user",
    targetId: student.id,
    metadata: { email: student.email },
  });

  return updated;
}

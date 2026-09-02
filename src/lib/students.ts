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
    return {
      student,
      alreadyApproved: true as const,
      emailSent: true,
      previewUrl: undefined,
    };
  }
  if (student.accountStatus === "REJECTED") {
    throw new HttpError(400, "This registration was rejected. Edit the student to restore it first.");
  }

  const now = new Date();
  let updated = student;
  if (student.accountStatus !== "ACTIVE") {
    const [activated] = await db
      .update(users)
      .set({
        accountStatus: "ACTIVE",
        approvedAt: now,
        rejectedAt: null,
      })
      .where(eq(users.id, student.id))
      .returning();
    updated = activated;

    await writeAudit({
      actorId: admin.id,
      action: "STUDENT_APPROVE",
      targetType: "user",
      targetId: student.id,
      metadata: { email: student.email },
    });
  }

  let previewUrl: string | undefined;
  let emailError: string | undefined;
  try {
    const email = approvalEmail(student.fullName);
    const result = await sendMail({
      to: student.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    previewUrl = result.previewUrl;
    const [withEmail] = await db
      .update(users)
      .set({ approvalEmailSentAt: new Date() })
      .where(eq(users.id, student.id))
      .returning();
    updated = withEmail;
  } catch (error) {
    emailError =
      error instanceof MailError
        ? error.message
        : "Notification email could not be sent.";
    console.error("Approval email failed", {
      studentId: student.id,
      email: student.email,
      error,
    });
  }

  return {
    student: updated,
    alreadyApproved: false as const,
    emailSent: !emailError,
    emailError,
    previewUrl,
  };
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

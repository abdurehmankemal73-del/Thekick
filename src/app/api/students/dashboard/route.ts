import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { grades, permissionRequests, users } from "@/db/schema";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/guards";
import { publicGrade, publicUser, sameBeltMember } from "@/lib/dtos";
import { getPublishedAnnouncements } from "@/lib/queries";

export async function GET() {
  try {
    const user = await requireStudent();

    const [gradeRows, permissionRows, announcements, memberRows] = await Promise.all([
      db
        .select()
        .from(grades)
        .where(eq(grades.studentId, user.id))
        .orderBy(desc(grades.assessmentDate))
        .limit(5),
      db
        .select()
        .from(permissionRequests)
        .where(eq(permissionRequests.studentId, user.id))
        .orderBy(desc(permissionRequests.createdAt))
        .limit(5),
      getPublishedAnnouncements(4),
      user.beltLevel
        ? db
            .select({ fullName: users.fullName, beltLevel: users.beltLevel })
            .from(users)
            .where(
              and(
                eq(users.role, "STUDENT"),
                eq(users.accountStatus, "ACTIVE"),
                eq(users.beltLevel, user.beltLevel),
              ),
            )
        : Promise.resolve([]),
    ]);

    return json({
      user: publicUser(user),
      grades: gradeRows.map(publicGrade),
      permissions: permissionRows,
      announcements,
      members: memberRows.map(sameBeltMember),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

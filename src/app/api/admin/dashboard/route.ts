import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  announcements,
  grades,
  permissionRequests,
  users,
} from "@/db/schema";
import { errorResponse, json } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { BELT_LEVELS } from "@/lib/constants";

export async function GET() {
  try {
    await requireAdmin();

    const [totalStudents] = await db
      .select({ n: count() })
      .from(users)
      .where(eq(users.role, "STUDENT"));
    const [pendingRegistrations] = await db
      .select({ n: count() })
      .from(users)
      .where(and(eq(users.role, "STUDENT"), eq(users.accountStatus, "PENDING")));
    const [totalPermissions] = await db.select({ n: count() }).from(permissionRequests);
    const [pendingPermissions] = await db
      .select({ n: count() })
      .from(permissionRequests)
      .where(eq(permissionRequests.status, "PENDING"));
    const [totalAnnouncements] = await db.select({ n: count() }).from(announcements);

    const beltRows = await db
      .select({ belt: users.beltLevel, n: count() })
      .from(users)
      .where(eq(users.role, "STUDENT"))
      .groupBy(users.beltLevel);

    const beltDistribution = BELT_LEVELS.map((belt) => ({
      belt,
      count: Number(beltRows.find((row) => row.belt === belt)?.n ?? 0),
    }));

    const recentRegistrations = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        beltLevel: users.beltLevel,
        accountStatus: users.accountStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "STUDENT"))
      .orderBy(desc(users.createdAt))
      .limit(5);

    const recentPermissions = await db
      .select({
        permission: permissionRequests,
        studentName: users.fullName,
      })
      .from(permissionRequests)
      .innerJoin(users, eq(permissionRequests.studentId, users.id))
      .orderBy(desc(permissionRequests.createdAt))
      .limit(5);

    const recentGrades = await db
      .select({
        grade: grades,
        studentName: users.fullName,
      })
      .from(grades)
      .innerJoin(users, eq(grades.studentId, users.id))
      .orderBy(desc(grades.createdAt))
      .limit(5);

    const recentAnnouncements = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt))
      .limit(5);

    const pendingStudents = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        beltLevel: users.beltLevel,
        accountStatus: users.accountStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.role, "STUDENT"), eq(users.accountStatus, "PENDING")))
      .orderBy(desc(users.createdAt))
      .limit(12);

    return json({
      stats: {
        totalStudents: Number(totalStudents.n),
        pendingRegistrations: Number(pendingRegistrations.n),
        totalPermissions: Number(totalPermissions.n),
        pendingPermissions: Number(pendingPermissions.n),
        totalAnnouncements: Number(totalAnnouncements.n),
      },
      beltDistribution,
      pendingStudents,
      recentRegistrations,
      recentPermissions: recentPermissions.map((row) => ({
        ...row.permission,
        studentName: row.studentName,
      })),
      recentGrades: recentGrades.map((row) => ({
        ...row.grade,
        studentName: row.studentName,
      })),
      recentAnnouncements,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

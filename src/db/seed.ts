import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  announcements,
  clubSettings,
  grades,
  permissionRequests,
  users,
} from "./schema";
import { DEFAULT_CLUB_SETTINGS } from "../lib/constants";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  const conn = postgres(url, { max: 1 });
  const db = drizzle(conn);

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const [byEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);
  const [byRole] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "ADMIN"))
    .limit(1);

  const existingAdmin = byEmail ?? byRole;
  let adminId = existingAdmin?.id;

  if (existingAdmin) {
    await db
      .update(users)
      .set({
        email: adminEmail,
        fullName: "Club Administrator",
        name: "Club Administrator",
        passwordHash,
        role: "ADMIN",
        accountStatus: "ACTIVE",
        beltLevel: null,
        telegramUsername: "TheKickITF",
      })
      .where(eq(users.id, existingAdmin.id));
  } else {
    const [created] = await db
      .insert(users)
      .values({
        email: adminEmail,
        fullName: "Club Administrator",
        name: "Club Administrator",
        passwordHash,
        role: "ADMIN",
        accountStatus: "ACTIVE",
        telegramUsername: "TheKickITF",
      })
      .returning({ id: users.id });
    adminId = created.id;
  }

  const [existingSettings] = await db
    .select({ id: clubSettings.id })
    .from(clubSettings)
    .where(eq(clubSettings.id, "default"))
    .limit(1);

  if (!existingSettings) {
    await db.insert(clubSettings).values({
      id: "default",
      ...DEFAULT_CLUB_SETTINGS,
    });
  }

  if (process.env.SEED_DEMO === "true" && adminId) {
    const demoPassword = await bcrypt.hash("Student123!", 12);
    const demoStudents = [
      {
        email: "liya.yellow@thekick.local",
        fullName: "Liya Bekele",
        telegramUsername: "liya_yellow",
        beltLevel: "YELLOW" as const,
      },
      {
        email: "samuel.yellow@thekick.local",
        fullName: "Samuel Tadesse",
        telegramUsername: "samuel_yellow",
        beltLevel: "YELLOW" as const,
      },
      {
        email: "hana.white@thekick.local",
        fullName: "Hana Mohammed",
        telegramUsername: "hana_white",
        beltLevel: "WHITE" as const,
      },
      {
        email: "yonas.green@thekick.local",
        fullName: "Yonas Alemu",
        telegramUsername: "yonas_green",
        beltLevel: "GREEN" as const,
      },
    ];

    const createdIds: string[] = [];

    for (const student of demoStudents) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, student.email))
        .limit(1);

      if (existing) {
        createdIds.push(existing.id);
        continue;
      }

      const [row] = await db
        .insert(users)
        .values({
          ...student,
          name: student.fullName,
          passwordHash: demoPassword,
          role: "STUDENT",
          accountStatus: "ACTIVE",
        })
        .returning({ id: users.id });
      createdIds.push(row.id);
    }

    const liyaId = createdIds[0];
    const [existingGrade] = await db
      .select({ id: grades.id })
      .from(grades)
      .where(eq(grades.studentId, liyaId))
      .limit(1);

    if (!existingGrade) {
      await db.insert(grades).values({
        studentId: liyaId,
        assessmentName: "Monthly grading — Yellow Belt",
        patternScore: 82,
        sparringScore: 78,
        kicksScore: 85,
        theoryScore: 80,
        disciplineScore: 90,
        overallScore: 83,
        result: "Pass",
        instructorComment: "Strong patterns. Continue sharpening side kick chamber.",
        assessmentDate: new Date("2026-07-15"),
      });
    }

    const [existingPerm] = await db
      .select({ id: permissionRequests.id })
      .from(permissionRequests)
      .where(eq(permissionRequests.studentId, liyaId))
      .limit(1);

    if (!existingPerm) {
      await db.insert(permissionRequests).values({
        studentId: liyaId,
        absenceType: "CLASS_EXAM",
        reason: "I have a university exam tomorrow afternoon.",
        status: "PENDING",
      });
    }

    const [existingAnn] = await db
      .select({ id: announcements.id })
      .from(announcements)
      .limit(1);

    if (!existingAnn) {
      await db.insert(announcements).values({
        title: "Welcome to THE KICK training term",
        content:
          "Classes resume this week. Bring your dobok, water, and arrive five minutes early. New students must complete registration and wait for admin approval.",
        status: "PUBLISHED",
        authorId: adminId,
      });
    }

    console.log("Demo students seeded. Password for demo students: Student123!");
  }

  console.log(`Admin ready: ${adminEmail}`);
  await conn.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

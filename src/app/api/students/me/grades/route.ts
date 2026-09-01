import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { grades } from "@/db/schema";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/guards";
import { publicGrade } from "@/lib/dtos";

export async function GET() {
  try {
    const user = await requireStudent();
    const rows = await db
      .select()
      .from(grades)
      .where(eq(grades.studentId, user.id))
      .orderBy(desc(grades.assessmentDate));
    return json({ grades: rows.map(publicGrade) });
  } catch (error) {
    return errorResponse(error);
  }
}

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { permissionRequests } from "@/db/schema";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/guards";

export async function GET() {
  try {
    const user = await requireStudent();
    const rows = await db
      .select()
      .from(permissionRequests)
      .where(eq(permissionRequests.studentId, user.id))
      .orderBy(desc(permissionRequests.createdAt));
    return json({ permissions: rows });
  } catch (error) {
    return errorResponse(error);
  }
}

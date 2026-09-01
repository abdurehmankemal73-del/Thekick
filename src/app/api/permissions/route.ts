import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { permissionRequests } from "@/db/schema";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireStudent } from "@/lib/guards";
import { permissionCreateSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const user = await requireStudent();
    const body = await readJson<unknown>(request);
    const data = permissionCreateSchema.parse(body);

    const [created] = await db
      .insert(permissionRequests)
      .values({
        studentId: user.id,
        absenceType: data.absenceType,
        reason: data.reason,
        status: "PENDING",
      })
      .returning();

    return json({ permission: created }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

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

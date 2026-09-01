import { eq } from "drizzle-orm";
import { db } from "@/db";
import { permissionRequests } from "@/db/schema";
import { errorResponse, json, readJson, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { permissionAdminUpdateSchema } from "@/lib/validations";
import { writeAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await readJson<unknown>(request);
    const data = permissionAdminUpdateSchema.parse(body);

    const [existing] = await db
      .select()
      .from(permissionRequests)
      .where(eq(permissionRequests.id, id))
      .limit(1);
    if (!existing) throw new HttpError(404, "Permission request not found");

    const [updated] = await db
      .update(permissionRequests)
      .set({
        status: data.status,
        adminNote: data.adminNote || null,
      })
      .where(eq(permissionRequests.id, id))
      .returning();

    await writeAudit({
      actorId: admin.id,
      action: data.status === "APPROVED" ? "PERMISSION_APPROVE" : "PERMISSION_REJECT",
      targetType: "permission",
      targetId: id,
    });

    return json({ permission: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const [existing] = await db
      .select()
      .from(permissionRequests)
      .where(eq(permissionRequests.id, id))
      .limit(1);
    if (!existing) throw new HttpError(404, "Permission request not found");

    await db.delete(permissionRequests).where(eq(permissionRequests.id, id));
    await writeAudit({
      actorId: admin.id,
      action: "PERMISSION_DELETE",
      targetType: "permission",
      targetId: id,
    });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

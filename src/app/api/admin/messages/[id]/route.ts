import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { errorResponse, json, readJson, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const body = await readJson<unknown>(request);
    const data = z.object({ status: z.enum(["NEW", "READ"]) }).parse(body);

    const [existing] = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.id, id))
      .limit(1);
    if (!existing) throw new HttpError(404, "Message not found");

    const [updated] = await db
      .update(contactMessages)
      .set({ status: data.status })
      .where(eq(contactMessages.id, id))
      .returning();

    return json({ message: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { errorResponse, json } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";

export async function GET() {
  try {
    await requireAdmin();
    const messages = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
    return json({ messages });
  } catch (error) {
    return errorResponse(error);
  }
}

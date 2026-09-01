import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { errorResponse, json, HttpError } from "@/lib/http";
import { requireStudent } from "@/lib/guards";
import { sameBeltMember } from "@/lib/dtos";

export async function GET(request: NextRequest) {
  try {
    const user = await requireStudent();
    if (!user.beltLevel) {
      throw new HttpError(400, "Your belt level is not set");
    }

    const attemptedBelt = request.nextUrl.searchParams.get("belt");
    if (attemptedBelt && attemptedBelt !== user.beltLevel) {
      throw new HttpError(403, "You can only view students in your belt level");
    }

    const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase();

    const rows = await db
      .select({
        fullName: users.fullName,
        beltLevel: users.beltLevel,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "STUDENT"),
          eq(users.accountStatus, "ACTIVE"),
          eq(users.beltLevel, user.beltLevel),
        ),
      );

    const members = rows
      .filter((row) =>
        q ? row.fullName.toLowerCase().includes(q) : true,
      )
      .map(sameBeltMember);

    return json({ beltLevel: user.beltLevel, members });
  } catch (error) {
    return errorResponse(error);
  }
}

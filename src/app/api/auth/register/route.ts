import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { json, errorResponse, readJson, HttpError } from "@/lib/http";
import { registerSchema } from "@/lib/validations";
import { publicUser } from "@/lib/dtos";

export async function POST(request: Request) {
  try {
    const body = await readJson<unknown>(request);
    const data = registerSchema.parse(body);

    const email = data.email.toLowerCase();
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      throw new HttpError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const [created] = await db
      .insert(users)
      .values({
        email,
        fullName: data.fullName,
        name: data.fullName,
        telegramUsername: data.telegramUsername,
        beltLevel: data.beltLevel,
        passwordHash,
        role: "STUDENT",
        accountStatus: "PENDING",
      })
      .returning();

    return json(
      {
        message:
          "Registration received. An administrator will approve your account before you can sign in.",
        user: publicUser(created),
      },
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}

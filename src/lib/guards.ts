import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { HttpError } from "@/lib/http";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return user ?? null;
}

export async function requireAuth(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw new HttpError(401, "You must be signed in");
  }
  if (user.accountStatus !== "ACTIVE") {
    throw new HttpError(403, "Your account is not active");
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new HttpError(403, "Admin access required");
  }
  return user;
}

export async function requireStudent(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "STUDENT") {
    throw new HttpError(403, "Student access required");
  }
  return user;
}

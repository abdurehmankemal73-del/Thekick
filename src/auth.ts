import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/validations";
import { loginRateLimit, clearLoginAttempts } from "@/lib/rate-limit";
import { passwordCandidates } from "@/lib/password-candidates";

class AuthError extends CredentialsSignin {
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const emailRaw = credentials?.email;
        const passwordRaw = credentials?.password;
        const parsed = loginSchema.safeParse({
          email: Array.isArray(emailRaw) ? emailRaw[0] : emailRaw,
          password: Array.isArray(passwordRaw) ? passwordRaw[0] : passwordRaw,
        });
        if (!parsed.success) {
          throw new AuthError("invalid_credentials");
        }

        const email = parsed.data.email.toLowerCase();
        const limit = loginRateLimit(`credentials:${email}`);
        if (!limit.ok) {
          throw new AuthError("too_many_attempts");
        }

        let user: typeof users.$inferSelect | undefined;
        try {
          const db = getDb();
          [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        } catch (error) {
          console.error("[auth] database lookup failed", error);
          throw new AuthError("service_unavailable");
        }

        if (!user || !user.passwordHash) {
          throw new AuthError("invalid_credentials");
        }

        const passwordHash = user.passwordHash;
        const valid = (
          await Promise.all(
            passwordCandidates(parsed.data.password).map((candidate) =>
              bcrypt.compare(candidate, passwordHash),
            ),
          )
        ).some(Boolean);
        if (!valid) {
          throw new AuthError("invalid_credentials");
        }

        if (user.accountStatus === "PENDING") {
          throw new AuthError("pending_approval");
        }
        if (user.accountStatus === "SUSPENDED") {
          throw new AuthError("account_suspended");
        }
        if (user.accountStatus === "REJECTED") {
          throw new AuthError("account_rejected");
        }

        clearLoginAttempts(`credentials:${email}`);

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          accountStatus: user.accountStatus,
          fullName: user.fullName,
          beltLevel: user.beltLevel,
        };
      },
    }),
  ],
});

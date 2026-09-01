import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { authConfig } from "@/auth.config";
import { getDb } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { loginSchema } from "@/lib/validations";
import { loginRateLimit, clearLoginAttempts } from "@/lib/rate-limit";

class AuthError extends CredentialsSignin {
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: process.env.DATABASE_URL
    ? DrizzleAdapter(getDb(), {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      })
    : undefined,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
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
        } catch {
          throw new AuthError("service_unavailable");
        }

        if (!user || !user.passwordHash) {
          throw new AuthError("invalid_credentials");
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
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

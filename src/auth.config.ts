import type { NextAuthConfig } from "next-auth";
import type { BeltLevel } from "@/db/schema";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;
      const status = auth?.user?.accountStatus;

      if (pathname.startsWith("/admin")) {
        return role === "ADMIN";
      }
      if (pathname.startsWith("/student")) {
        return role === "STUDENT" && status === "ACTIVE";
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountStatus = user.accountStatus;
        token.fullName = user.fullName;
        token.beltLevel = user.beltLevel;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "ADMIN" | "STUDENT";
      session.user.accountStatus = token.accountStatus as
        | "PENDING"
        | "ACTIVE"
        | "SUSPENDED"
        | "REJECTED";
      session.user.fullName = token.fullName as string;
      session.user.beltLevel = (token.beltLevel as BeltLevel | null) ?? null;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;

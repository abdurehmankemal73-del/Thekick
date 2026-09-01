import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;
  const status = req.auth?.user?.accountStatus;

  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }
  }

  if (pathname.startsWith("/student")) {
    if (!req.auth) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (status !== "ACTIVE") {
      const url = new URL("/login", req.url);
      url.searchParams.set("error", "pending_approval");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/student/:path*"],
};

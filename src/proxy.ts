import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

function isPayPath(pathname: string) {
  return pathname === "/pay" || pathname.startsWith("/pay/");
}

function isJoinPath(pathname: string) {
  return pathname.startsWith("/login") || pathname.startsWith("/register");
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;
  const status = req.auth?.user?.accountStatus;

  if (role === "STUDENT" && status === "PENDING" && !isPayPath(pathname) && !isJoinPath(pathname)) {
    return NextResponse.redirect(new URL("/pay", req.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (role !== "ADMIN") {
      const next = status === "PENDING" ? "/pay" : "/student/dashboard";
      return NextResponse.redirect(new URL(next, req.url));
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
    if (status === "PENDING") {
      return NextResponse.redirect(new URL("/pay", req.url));
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
  matcher: [
    "/((?!api|_next/static|_next/image|images/|icons/|sw\\.js|manifest\\.webmanifest|logo\\.jpg|icon|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2)$).*)",
  ],
};

import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/auth";

export const { POST } = handlers;

export async function GET(req: NextRequest) {
  const action = req.nextUrl.pathname.split("/").filter(Boolean).pop();
  if (action === "error") {
    const url = new URL("/login", req.nextUrl.origin);
    const error = req.nextUrl.searchParams.get("error");
    if (error) url.searchParams.set("error", error);
    return NextResponse.redirect(url);
  }
  return handlers.GET(req);
}

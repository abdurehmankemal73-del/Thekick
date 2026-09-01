import { NextRequest } from "next/server";

export function parsePage(request: NextRequest) {
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? 1) || 1);
  const rawSize = Number(request.nextUrl.searchParams.get("pageSize") ?? 12) || 12;
  const pageSize = Math.min(50, Math.max(1, rawSize));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

export function searchParam(request: NextRequest, key: string) {
  return request.nextUrl.searchParams.get(key)?.trim() || undefined;
}

import { NextRequest } from "next/server";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers = new Headers(init?.headers);
  if (!isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers,
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    details?: unknown;
  } & T;

  if (!res.ok) {
    throw new ApiError(res.status, data.error || "Request failed", data.details);
  }

  return data;
}

export function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

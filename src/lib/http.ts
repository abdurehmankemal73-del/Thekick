import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { fieldErrors } from "@/lib/validations";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    const details = fieldErrors(error);
    const first = Object.values(details)[0] ?? error.issues[0]?.message;
    return NextResponse.json(
      { error: first || "Invalid request", details },
      { status: 400 },
    );
  }
  console.error(error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

import { NextRequest } from "next/server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { json, errorResponse, readJson, HttpError } from "@/lib/http";
import { loginSchema } from "@/lib/validations";
import { clientKey, clearLoginAttempts, loginRateLimit } from "@/lib/rate-limit";

function authCode(error: unknown) {
  if (error instanceof AuthError) return error.type.toLowerCase();
  if (typeof error === "object" && error && "code" in error) {
    return String((error as { code?: string }).code ?? "").toLowerCase();
  }
  if (error instanceof Error) return error.message.toLowerCase();
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJson<unknown>(request);
    const data = loginSchema.parse(body);
    const key = clientKey(request, data.email);
    const limit = loginRateLimit(key);

    if (!limit.ok) {
      throw new HttpError(
        429,
        `Too many login attempts. Try again in ${limit.retryAfter} seconds.`,
      );
    }

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result && typeof result === "object" && "error" in result && result.error) {
        const code = `${"code" in result ? result.code : ""} ${result.error}`.toLowerCase();
        if (code.includes("pending_approval")) {
          throw new HttpError(403, "Your registration is pending administrator approval.");
        }
        if (code.includes("account_rejected")) {
          throw new HttpError(403, "Your registration was not approved.");
        }
        if (code.includes("account_suspended")) {
          throw new HttpError(403, "Your account has been suspended.");
        }
        if (code.includes("too_many")) {
          throw new HttpError(429, "Too many login attempts. Please wait and try again.");
        }
        if (code.includes("service_unavailable") || code.includes("econnrefused")) {
          throw new HttpError(503, "Sign-in is temporarily unavailable. Please try again later.");
        }
        throw new HttpError(401, "Invalid email or password");
      }
    } catch (error) {
      if (error instanceof HttpError) throw error;
      const code = authCode(error);
      if (code.includes("pending_approval")) {
        throw new HttpError(403, "Your registration is pending administrator approval.");
      }
      if (code.includes("account_rejected")) {
        throw new HttpError(403, "Your registration was not approved.");
      }
      if (code.includes("account_suspended")) {
        throw new HttpError(403, "Your account has been suspended.");
      }
      if (code.includes("next_redirect")) {
        clearLoginAttempts(key);
        return json({ ok: true });
      }
      if (code.includes("service_unavailable") || code.includes("econnrefused")) {
        throw new HttpError(503, "Sign-in is temporarily unavailable. Please try again later.");
      }
      if (
        code.includes("invalid_credentials") ||
        code.includes("credentialssignin")
      ) {
        throw new HttpError(401, "Invalid email or password");
      }
      throw error;
    }

    clearLoginAttempts(key);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

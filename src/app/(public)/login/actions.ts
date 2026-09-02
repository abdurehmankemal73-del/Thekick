"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { loginSchema } from "@/lib/validations";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false as const, code: "invalid_credentials" };
  }

  try {
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    if (typeof result === "string") {
      const url = new URL(result, "https://kick.smarterp.space");
      const code = url.searchParams.get("code") ?? url.searchParams.get("error");
      if (code) return { ok: false as const, code };
    }

    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthError) {
      const code =
        "code" in error && typeof error.code === "string" && error.code
          ? error.code
          : error.type;
      return { ok: false as const, code };
    }
    throw error;
  }
}

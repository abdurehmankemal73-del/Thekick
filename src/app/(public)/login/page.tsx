"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldError, InputWithIcon, Label, PasswordInput } from "@/components/ui/fields";
import { Icon, PageTitle } from "@/components/ui/icon";
import { fieldErrors, loginSchema } from "@/lib/validations";
import { useI18n } from "@/i18n/provider";
import { loginAction } from "./actions";

function safeCallback(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function loginMessage(code: string, fallback: string) {
  const normalized = code.toLowerCase();
  if (!normalized || normalized === "default" || normalized === "undefined") {
    return fallback;
  }
  if (normalized.includes("pending_approval")) {
    return "Your registration is pending administrator approval.";
  }
  if (normalized.includes("account_rejected")) {
    return "Your registration was not approved.";
  }
  if (normalized.includes("account_suspended")) {
    return "Your account has been suspended.";
  }
  if (normalized.includes("too_many")) {
    return "Too many login attempts. Please wait and try again.";
  }
  if (
    normalized.includes("configuration") ||
    normalized.includes("missingsecret") ||
    normalized.includes("service_unavailable") ||
    normalized.includes("econnrefused") ||
    normalized.includes("accessdenied") ||
    normalized.includes("callback")
  ) {
    return "Sign-in is temporarily unavailable. Please try again later.";
  }
  if (
    normalized.includes("invalid_credentials") ||
    normalized.includes("credentialssignin")
  ) {
    return "Invalid email or password.";
  }
  return fallback;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(() => {
    const error = params.get("error");
    if (!error) return null;
    if (error === "pending_approval") return t("pendingApproval");
    return loginMessage(error, t("loginFailed"));
  });
  const callbackUrl = safeCallback(params.get("callbackUrl"));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = loginSchema.safeParse({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setLoading(true);
    try {
      const result = await loginAction(formData);
      if (!result.ok) {
        const message = loginMessage(result.code, t("loginFailed"));
        setFormError(message);
        toast.error(message);
        return;
      }
      toast.success(t("signedIn"));
      router.push(callbackUrl ?? "/student/dashboard");
      router.refresh();
    } catch {
      setFormError(t("loginFailed"));
      toast.error(t("loginFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <PageTitle icon={LogIn} className="text-4xl">{t("studentLogin")}</PageTitle>
      <p className="mt-3 text-muted">{t("loginLead")}</p>
      <Card className="mt-8">
        {formError ? (
          <div className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900" role="alert">
            {formError}
          </div>
        ) : null}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {callbackUrl ? (
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
          ) : null}
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <InputWithIcon icon={Mail} id="email" name="email" type="email" autoComplete="email" required />
            <FieldError message={errors.email} />
          </div>
          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <PasswordInput id="password" name="password" autoComplete="current-password" required />
            <FieldError message={errors.password} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            <Icon icon={LogIn} />
            {loading ? t("signingIn") : t("signIn")}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted">
          {t("newStudent")}{" "}
          <Link href="/register" className="inline-flex items-center gap-1.5 font-semibold text-red">
            <Icon icon={UserPlus} />
            {t("joinKick")}
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

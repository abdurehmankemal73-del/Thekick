"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { LogIn, Mail, Send, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldError, Input, InputWithIcon, Label, PasswordInput } from "@/components/ui/fields";
import { Icon, PageTitle } from "@/components/ui/icon";
import { BeltLevelList } from "@/components/belt-level";
import { api, ApiError } from "@/lib/api";
import { fieldErrors, registerSchema } from "@/lib/validations";
import { useI18n } from "@/i18n/provider";

export default function RegisterPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [beltFormKey, setBeltFormKey] = useState(0);
  const submittingRef = useRef(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || loading) return;
    const form = event.currentTarget;
    setErrors({});
    setSuccess(null);
    const data = new FormData(form);
    const payload = {
      fullName: String(data.get("fullName") ?? ""),
      email: String(data.get("email") ?? ""),
      telegramUsername: String(data.get("telegramUsername") ?? ""),
      beltLevel: String(data.get("beltLevel") ?? ""),
      password: String(data.get("password") ?? ""),
      confirmPassword: String(data.get("confirmPassword") ?? ""),
    };
    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) {
      const details = fieldErrors(parsed.error);
      setErrors(details);
      toast.error(Object.values(details)[0] ?? t("registerFailed"));
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      const res = await api<{ message: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setSuccess(res.message);
      toast.success(t("registrationSubmitted"));
      form.reset();
      setBeltFormKey((key) => key + 1);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t("registerFailed");
      toast.error(message);
      if (error instanceof ApiError && error.details && typeof error.details === "object") {
        setErrors(error.details as Record<string, string>);
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <PageTitle icon={UserPlus} className="text-4xl">{t("joinKick")}</PageTitle>
      <p className="mt-3 text-muted">{t("registerLead")}</p>
      <Card className="mt-8">
        {success ? (
          <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-900">{success}</div>
        ) : null}
        <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
          <div>
            <Label htmlFor="fullName">{t("fullName")}</Label>
            <Input id="fullName" name="fullName" required />
            <FieldError message={errors.fullName} />
          </div>
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <InputWithIcon icon={Mail} id="email" name="email" type="email" required />
            <FieldError message={errors.email} />
          </div>
          <div>
            <Label htmlFor="telegramUsername">{t("telegramUsername")}</Label>
            <InputWithIcon icon={Send} id="telegramUsername" name="telegramUsername" placeholder="@username" required />
            <FieldError message={errors.telegramUsername} />
          </div>
          <div>
            <Label id="beltLevel-label">{t("beltLevel")}</Label>
            <p id="beltLevel-hint" className="mb-2 text-xs text-muted">{t("selectBelt")}</p>
            <BeltLevelList
              key={beltFormKey}
              name="beltLevel"
              required
              labelledBy="beltLevel-label"
              describedBy="beltLevel-hint"
            />
            <FieldError message={errors.beltLevel} />
          </div>
          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <PasswordInput id="password" name="password" autoComplete="new-password" required />
            <p className="mt-1 text-xs text-muted">{t("passwordHint")}</p>
            <FieldError message={errors.password} />
          </div>
          <div>
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required />
            <FieldError message={errors.confirmPassword} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            <Icon icon={UserPlus} />
            {loading ? t("creatingAccount") : t("createAccount")}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted">
          {t("alreadyRegistered")}{" "}
          <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-red">
            <Icon icon={LogIn} />
            {t("studentLogin")}
          </Link>
        </p>
      </Card>
    </div>
  );
}

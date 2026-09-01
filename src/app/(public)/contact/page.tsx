"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarClock, Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldError, Input, InputWithIcon, Label, Textarea } from "@/components/ui/fields";
import { Icon, PageTitle } from "@/components/ui/icon";
import { api, ApiError } from "@/lib/api";
import { FOOTER_CONTACT } from "@/lib/constants";
import { contactSchema, fieldErrors } from "@/lib/validations";
import type { ClubSettings } from "@/db/schema";
import { useI18n } from "@/i18n/provider";
import { TrainingScheduleTable } from "@/components/training-schedule-table";

export default function ContactPage() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api<{ settings: ClubSettings }>("/api/settings")
      .then((res) => setSettings(res.settings))
      .catch(() => setSettings(null));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") ?? ""),
      email: String(form.get("email") ?? ""),
      message: String(form.get("message") ?? ""),
    };
    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ message: string }>("/api/contact", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      toast.success(res.message);
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("sendFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-16 lg:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red">{t("contactEyebrow")}</p>
        <PageTitle icon={Mail} className="mt-3 text-4xl">{t("trainWithUs")}</PageTitle>
        <p className="mt-4 text-muted">{t("contactLead")}</p>
        <ul className="mt-8 space-y-4 text-sm">
          {[
            {
              icon: Mail,
              label: t("email"),
              value: FOOTER_CONTACT.email,
              href: `mailto:${FOOTER_CONTACT.email}`,
            },
            {
              icon: Send,
              label: t("telegram"),
              value: FOOTER_CONTACT.telegram,
              href: `https://t.me/${FOOTER_CONTACT.telegram.replace(/^@/, "")}`,
            },
            {
              icon: Phone,
              label: t("phone"),
              value: FOOTER_CONTACT.phone,
              href: `tel:${FOOTER_CONTACT.tel}`,
            },
            { icon: MapPin, label: t("location"), value: settings?.location },
          ].map((item) => (
            <li key={item.label} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-white text-gold">
                <Icon icon={item.icon} />
              </span>
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{item.label}</span>
                {"href" in item && item.href ? (
                  <a href={item.href} className="mt-0.5 block whitespace-pre-line hover:text-red">
                    {item.value}
                  </a>
                ) : (
                  <span className="mt-0.5 block whitespace-pre-line">{item.value}</span>
                )}
              </span>
            </li>
          ))}
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-white text-gold">
              <Icon icon={CalendarClock} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{t("schedule")}</p>
              <TrainingScheduleTable light />
            </div>
          </li>
        </ul>
      </div>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
            <Label htmlFor="message">{t("message")}</Label>
            <Textarea id="message" name="message" required />
            <FieldError message={errors.message} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            <Icon icon={Send} />
            {loading ? t("sending") : t("send")}
          </Button>
        </form>
      </Card>
    </div>
  );
}

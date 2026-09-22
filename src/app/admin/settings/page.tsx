"use client";

import { FormEvent, useEffect, useState } from "react";
import { Camera, Mail, MapPin, Phone, Play, Save, Send, Settings, Share2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/fields";
import { Skeleton } from "@/components/ui/empty-state";
import { Icon, PageTitle, SectionTitle } from "@/components/ui/icon";
import { PaymentMethodsEditor } from "@/components/payment-methods";
import type { ClubSettings } from "@/db/schema";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/constants";
import { useI18n } from "@/i18n/provider";
import type { LucideIcon } from "lucide-react";

export default function AdminSettingsPage() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ settings: ClubSettings }>("/api/admin/settings").then((res) =>
      setSettings({
        ...res.settings,
        paymentMethods: res.settings.paymentMethods ?? DEFAULT_PAYMENT_METHODS,
      }),
    );
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await api<{ settings: ClubSettings }>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          ...payload,
          instructors: settings.instructors,
          paymentMethods: settings.paymentMethods,
        }),
      });
      setSettings(res.settings);
      toast.success("Club information updated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  if (!settings) return <Skeleton className="h-96" />;

  const fields: Array<[string, string, string, LucideIcon]> = [
    ["email", "Email", settings.email, Mail],
    ["phone", "Phone", settings.phone, Phone],
    ["telegram", "Telegram", settings.telegram, Send],
    ["location", "Training location", settings.location, MapPin],
    ["facebookUrl", "Facebook URL", settings.facebookUrl ?? "", Share2],
    ["instagramUrl", "Instagram URL", settings.instagramUrl ?? "", Camera],
    ["youtubeUrl", "YouTube URL", settings.youtubeUrl ?? "", Play],
  ];

  const areas = [
    ["schedule", "Training schedule", settings.schedule],
    ["about", "About", settings.about],
    ["mission", "Mission", settings.mission],
    ["vision", "Vision", settings.vision],
    ["philosophy", "Philosophy", settings.philosophy],
    ["itfInfo", "ITF information", settings.itfInfo],
    ["activities", "Activities", settings.activities],
    ["achievements", "Achievements", settings.achievements],
  ] as const;

  return (
    <div className="max-w-3xl space-y-4">
      <PageTitle icon={Settings}>{t("clubSettings")}</PageTitle>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          {fields.map(([name, label, value, icon]) => (
            <div key={name}>
              <Label htmlFor={name} className="inline-flex items-center gap-2">
                <Icon icon={icon} className="text-gold" />
                {label}
              </Label>
              <Input id={name} name={name} defaultValue={value} />
            </div>
          ))}
          {areas.map(([name, label, value]) => (
            <div key={name}>
              <Label htmlFor={name}>{label}</Label>
              <Textarea id={name} name={name} defaultValue={value} />
            </div>
          ))}
          <div className="border-t border-line pt-4">
            <SectionTitle icon={Wallet}>{t("payMethods")}</SectionTitle>
            <p className="mb-4 mt-1 text-sm text-muted">{t("payLead")}</p>
            <PaymentMethodsEditor
              methods={settings.paymentMethods}
              onChange={(paymentMethods) => setSettings({ ...settings, paymentMethods })}
            />
          </div>
          <Button type="submit" disabled={loading}>
            <Icon icon={Save} />
            {loading ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

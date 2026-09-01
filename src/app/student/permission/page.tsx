"use client";

import { FormEvent, useEffect, useState } from "react";
import { ClipboardList, Send } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldError, Label, Select, Textarea } from "@/components/ui/fields";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, PageTitle, SectionTitle } from "@/components/ui/icon";
import { ABSENCE_LABELS, ABSENCE_TYPES } from "@/lib/constants";
import { fieldErrors, permissionCreateSchema } from "@/lib/validations";
import { formatDateTime } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

type Permission = {
  id: string;
  absenceType: keyof typeof ABSENCE_LABELS;
  reason: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
};

export default function PermissionPage() {
  const { t, tAbsence } = useI18n();
  const [items, setItems] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState("");

  function load() {
    api<{ permissions: Permission[] }>("/api/permissions/me").then((res) => setItems(res.permissions));
    api<{ user: { fullName: string } }>("/api/students/me").then((res) => setName(res.user.fullName));
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      absenceType: String(form.get("absenceType") ?? ""),
      reason: String(form.get("reason") ?? ""),
    };
    const parsed = permissionCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setLoading(true);
    try {
      await api("/api/permissions", { method: "POST", body: JSON.stringify(parsed.data) });
      toast.success(t("permissionSubmitted"));
      event.currentTarget.reset();
      setErrors({});
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("couldNotSubmit"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <PageTitle icon={ClipboardList}>{t("permission")}</PageTitle>
        <Card className="mt-4">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <Label>{t("fullName")}</Label>
              <p className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm">{name || "…"}</p>
            </div>
            <div>
              <Label htmlFor="absenceType">{t("absenceType")}</Label>
              <Select id="absenceType" name="absenceType" required defaultValue="">
                <option value="" disabled>
                  {t("selectOne")}
                </option>
                {ABSENCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {tAbsence(type)}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.absenceType} />
            </div>
            <div>
              <Label htmlFor="reason">{t("shortReason")}</Label>
              <Textarea id="reason" name="reason" placeholder={t("reasonHint")} required />
              <FieldError message={errors.reason} />
            </div>
            <Button type="submit" disabled={loading}>
              <Icon icon={Send} />
              {loading ? t("submitting") : t("submitRequest")}
            </Button>
          </form>
        </Card>
      </div>
      <div>
        <SectionTitle icon={ClipboardList} className="text-2xl">{t("yourRequests")}</SectionTitle>
        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <EmptyState title={t("noPermissions")} icon={ClipboardList} />
          ) : (
            items.map((item) => (
              <Card key={item.id}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{tAbsence(item.absenceType)}</p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-sm text-muted">{item.reason}</p>
                <p className="mt-2 text-xs text-muted">{formatDateTime(item.createdAt)}</p>
                {item.adminNote ? <p className="mt-2 text-sm">{t("adminNote")}: {item.adminNote}</p> : null}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

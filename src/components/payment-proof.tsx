"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";

export function PaymentProofForm() {
  const { data, status } = useSession();
  const { t } = useI18n();
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const pending = data?.user?.role === "STUDENT" && data.user.accountStatus === "PENDING";

  useEffect(() => {
    if (!pending) return;
    api<{ user: { paymentProofSubmittedAt: string | null } }>("/api/auth/me")
      .then((res) => {
        if (res.user.paymentProofSubmittedAt) {
          setSentAt(res.user.paymentProofSubmittedAt);
          setPreview(`/api/payments/proof?t=${encodeURIComponent(res.user.paymentProofSubmittedAt)}`);
        }
      })
      .catch(() => undefined);
  }, [pending]);

  if (status === "loading") return null;
  if (!pending) {
    if (data?.user) return null;
    return (
      <Card className="mt-8">
        <p className="text-sm text-muted">
          {t("payProofNeedAccount")}{" "}
          <Link href="/register" className="font-semibold text-red">{t("joinKick")}</Link>
          {" · "}
          <Link href="/login" className="font-semibold text-red">{t("studentLogin")}</Link>
        </p>
      </Card>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("screenshot");
    if (!(file instanceof File) || file.size === 0) {
      toast.error(t("payProofChoose"));
      return;
    }
    setSending(true);
    try {
      const res = await api<{ paymentProofSubmittedAt: string }>("/api/payments/proof", {
        method: "POST",
        body: new FormData(form),
      });
      setSentAt(res.paymentProofSubmittedAt);
      setPreview(`/api/payments/proof?t=${Date.now()}`);
      toast.success(t("payProofSent"));
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("sendFailed"));
    } finally {
      setSending(false);
    }
  }

  const shown = preview ?? (sentAt ? `/api/payments/proof?t=${encodeURIComponent(sentAt)}` : null);

  return (
    <Card className="mt-8">
      <h2 className="text-xl">{t("payProofTitle")}</h2>
      <p className="mt-2 text-sm text-muted">{t("payProofLead")}</p>
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt={t("adminProof")} className="mt-4 max-h-80 rounded-md border border-line object-contain" />
      ) : null}
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          name="screenshot"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required={!shown}
          className="block w-full text-sm"
        />
        <Button type="submit" disabled={sending}>
          <Icon icon={ImageUp} />
          {sending ? t("payProofSending") : shown ? t("payProofReplace") : t("payProofSend")}
        </Button>
      </form>
      <p className="mt-3 text-sm text-muted">{t("payProofWaiting")}</p>
    </Card>
  );
}

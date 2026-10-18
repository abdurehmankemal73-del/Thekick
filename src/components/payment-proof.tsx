"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Clock, ImageUp } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";

export function PaymentProofForm({
  pending: pendingFromServer = false,
  proofSubmittedAt = null,
  onSubmitted,
}: {
  pending?: boolean;
  proofSubmittedAt?: string | null;
  /** Reports the submitted timestamp so the surrounding flow can track progress. */
  onSubmitted?: (iso: string) => void;
}) {
  const { data, status } = useSession();
  const { t, locale } = useI18n();
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(proofSubmittedAt);
  const [serverPreview, setServerPreview] = useState<string | null>(
    proofSubmittedAt ? `/api/payments/proof?t=${encodeURIComponent(proofSubmittedAt)}` : null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const pending =
    pendingFromServer || (data?.user?.role === "STUDENT" && data.user.accountStatus === "PENDING");

  useEffect(() => {
    if (!pending) return;
    api<{ user: { paymentProofSubmittedAt: string | null } }>("/api/auth/me")
      .then((res) => {
        if (res.user.paymentProofSubmittedAt) {
          const iso = res.user.paymentProofSubmittedAt;
          setSentAt(iso);
          setServerPreview(`/api/payments/proof?t=${encodeURIComponent(iso)}`);
          onSubmitted?.(iso);
        }
      })
      .catch(() => undefined);
  }, [pending, onSubmitted]);

  // Revoke each object URL once it is replaced or the form unmounts.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  if (!pending && status === "loading") return null;
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

  function chooseFile(next: File | null) {
    if (next && !ACCEPTED.split(",").includes(next.type)) {
      toast.error(t("payProofChoose"));
      return;
    }
    setFile(next);
    setLocalPreview(next ? URL.createObjectURL(next) : null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      toast.error(t("payProofChoose"));
      return;
    }
    setSending(true);
    try {
      const body = new FormData();
      body.append("screenshot", file);
      const res = await api<{ paymentProofSubmittedAt: string }>("/api/payments/proof", {
        method: "POST",
        body,
      });
      setSentAt(res.paymentProofSubmittedAt);
      setServerPreview(`/api/payments/proof?t=${Date.now()}`);
      onSubmitted?.(res.paymentProofSubmittedAt);
      toast.success(t("payProofSent"));
      chooseFile(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t("sendFailed"));
    } finally {
      setSending(false);
    }
  }

  const shown = localPreview ?? serverPreview;
  const sentDate = sentAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(sentAt),
      )
    : null;

  return (
    <Card className="mt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl">{t("payProofTitle")}</h2>
          <p className="mt-2 text-sm text-muted">{t("payProofLead")}</p>
        </div>
        {sentDate ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            {t("payProofAt").replace("{date}", sentDate)}
          </span>
        ) : null}
      </div>

      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shown}
          alt={t("adminProof")}
          className="mt-4 max-h-80 rounded-md border border-line object-contain"
        />
      ) : null}

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            chooseFile(event.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "rounded-xl border-2 border-dashed px-4 py-6 text-center transition",
            dragging ? "border-red bg-red/5" : "border-line bg-surface/50 hover:border-gold/70",
          )}
        >
          <Icon icon={ImageUp} size="md" className="mx-auto text-gold" />
          <p className="mt-2 truncate text-sm font-medium text-ink">
            {file ? file.name : t("payProofDrop")}
          </p>
          <label className="mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-semibold transition hover:border-gold">
            {t("payProofChoose")}
            <input
              type="file"
              name="screenshot"
              accept={ACCEPTED}
              className="sr-only"
              onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <Button type="submit" disabled={sending}>
          <Icon icon={ImageUp} />
          {sending ? t("payProofSending") : sentAt ? t("payProofReplace") : t("payProofSend")}
        </Button>
      </form>

      <p className="mt-3 flex items-start gap-2 text-sm text-muted">
        <Icon icon={Clock} className="mt-0.5 text-gold" />
        {t("payProofWaiting")}
      </p>
    </Card>
  );
}

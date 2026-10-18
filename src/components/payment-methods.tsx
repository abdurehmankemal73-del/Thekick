"use client";

import { useState } from "react";
import { Check, Copy, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";
import {
  ACCOUNT_HOLDER_NAME,
  PAYMENT_LOGO_OPTIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/db/schema";

function LogoImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // The failure is keyed to the src, so a new URL automatically retries.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(src) && failedSrc === src;

  if (!src || failed) {
    return (
      <span className={cn("inline-flex items-center justify-center text-gold", className)}>
        <Icon icon={Wallet} size="md" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}

async function copyText(value: string, success: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(success);
    return true;
  } catch {
    return false;
  }
}

function PaymentMethodCard({
  method,
  onCopied,
  highlighted = false,
}: {
  method: PaymentMethod;
  onCopied?: (method: PaymentMethod) => void;
  highlighted?: boolean;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copyNumber() {
    const ok = await copyText(method.accountNumber, t("payCopied"));
    if (!ok) return;
    onCopied?.(method);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={() => void copyNumber()}
      aria-pressed={highlighted}
      title={t("payCopy")}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-[0_10px_30px_-18px_rgba(11,11,12,0.45)] transition focus-visible:outline-none",
        "hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-[0_18px_40px_-18px_rgba(200,16,46,0.35)]",
        highlighted ? "border-gold ring-1 ring-gold/50" : "border-line/80",
      )}
    >
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-bg via-bg-soft to-bg/70 px-5 py-4">
        <div className="flex h-12 w-[7.5rem] items-center justify-center rounded-xl bg-white px-2 shadow-sm">
          <LogoImage
            src={method.logoUrl}
            alt={method.label}
            className="max-h-9 max-w-[6.5rem] object-contain"
          />
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-soft">
          {method.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          {t("payAccountName")}
        </p>
        <p className="mt-1 text-sm font-medium text-ink">{method.accountName}</p>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          {t("payAccountNumber")}
        </p>
        <p className="mt-1 font-mono text-lg font-semibold tracking-[0.12em] text-ink break-all">
          {method.accountNumber}
        </p>
        <span
          className={cn(
            "mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition",
            copied ? "bg-emerald-50 text-emerald-800" : "bg-bg text-cream group-hover:bg-red",
          )}
        >
          <Icon icon={copied ? Check : Copy} />
          {copied ? t("payCopied") : t("payCopy")}
        </span>
      </div>
    </button>
  );
}

export function PaymentMethodCards({
  methods,
  onCopied,
  highlightId,
}: {
  methods: PaymentMethod[];
  onCopied?: (method: PaymentMethod) => void;
  highlightId?: string | null;
}) {
  const { t } = useI18n();
  const visible = methods.filter((method) => method.enabled);
  if (visible.length === 0) {
    return <EmptyState title={t("payNoMethods")} icon={Wallet} />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {visible.map((method) => (
        <PaymentMethodCard
          key={method.id}
          method={method}
          onCopied={onCopied}
          highlighted={highlightId === method.id}
        />
      ))}
    </div>
  );
}

export function PaymentMethodsEditor({
  methods,
  onChange,
}: {
  methods: PaymentMethod[];
  onChange: (methods: PaymentMethod[]) => void;
}) {
  const { t } = useI18n();

  function update(index: number, patch: Partial<PaymentMethod>) {
    onChange(methods.map((method, i) => (i === index ? { ...method, ...patch } : method)));
  }

  function addMethod() {
    onChange([
      ...methods,
      {
        id: crypto.randomUUID(),
        label: "",
        accountName: ACCOUNT_HOLDER_NAME,
        accountNumber: "",
        logoUrl: PAYMENT_LOGO_OPTIONS[0]?.logoUrl ?? "",
        enabled: true,
      },
    ]);
  }

  function removeMethod(index: number) {
    onChange(methods.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {methods.map((method, index) => (
        <Card key={method.id} className="space-y-3 bg-surface/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex h-14 w-28 items-center justify-center rounded-md border border-line bg-white px-2">
              <LogoImage
                src={method.logoUrl}
                alt={method.label || t("payLogoUrl")}
                className="max-h-12 max-w-24 object-contain"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={method.enabled}
                onChange={(event) => update(index, { enabled: event.target.checked })}
              />
              {t("payEnabled")}
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_LOGO_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                title={option.label}
                onClick={() =>
                  update(index, {
                    logoUrl: option.logoUrl,
                    label: method.label || option.label,
                  })
                }
                className={cn(
                  "flex h-12 w-20 items-center justify-center rounded-md border bg-white px-1 transition",
                  method.logoUrl === option.logoUrl ? "border-gold ring-1 ring-gold" : "border-line hover:border-gold",
                )}
              >
                <LogoImage src={option.logoUrl} alt={option.label} className="max-h-10 max-w-16 object-contain" />
              </button>
            ))}
          </div>
          <div>
            <Label htmlFor={`pay-label-${method.id}`}>{t("payLabel")}</Label>
            <Input
              id={`pay-label-${method.id}`}
              value={method.label}
              onChange={(event) => update(index, { label: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor={`pay-name-${method.id}`}>{t("payAccountName")}</Label>
            <Input
              id={`pay-name-${method.id}`}
              value={method.accountName}
              onChange={(event) => update(index, { accountName: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor={`pay-number-${method.id}`}>{t("payAccountNumber")}</Label>
            <Input
              id={`pay-number-${method.id}`}
              value={method.accountNumber}
              onChange={(event) => update(index, { accountNumber: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor={`pay-logo-${method.id}`}>{t("payLogoUrl")}</Label>
            <Input
              id={`pay-logo-${method.id}`}
              value={method.logoUrl}
              onChange={(event) => update(index, { logoUrl: event.target.value })}
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => removeMethod(index)}>
            <Icon icon={Trash2} />
            {t("payRemove")}
          </Button>
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={addMethod}>
        <Icon icon={Plus} />
        {t("payAddMethod")}
      </Button>
    </div>
  );
}

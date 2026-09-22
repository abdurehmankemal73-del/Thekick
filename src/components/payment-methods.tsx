"use client";

import { useEffect, useState } from "react";
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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

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
      onError={() => setFailed(true)}
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

function PaymentMethodCard({ method }: { method: PaymentMethod }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copyNumber() {
    const ok = await copyText(method.accountNumber, t("payCopied"));
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Card className="flex h-full flex-col">
      <div className="flex h-20 items-center justify-center rounded-lg bg-surface px-4">
        <LogoImage
          src={method.logoUrl}
          alt={method.label}
          className="max-h-16 max-w-[160px] object-contain"
        />
      </div>
      <p className="mt-4 font-display text-xl">{method.label}</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {t("payAccountName")}
          </dt>
          <dd className="mt-0.5 font-medium">{method.accountName}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {t("payAccountNumber")}
          </dt>
          <dd className="mt-0.5 break-all font-medium tracking-wide">{method.accountNumber}</dd>
        </div>
      </dl>
      <Button type="button" variant="outline" className="mt-5 w-full" onClick={() => void copyNumber()}>
        <Icon icon={copied ? Check : Copy} />
        {copied ? t("payCopied") : t("payCopy")}
      </Button>
    </Card>
  );
}

export function PaymentMethodCards({ methods }: { methods: PaymentMethod[] }) {
  const { t } = useI18n();
  const visible = methods.filter((method) => method.enabled);
  if (visible.length === 0) {
    return <EmptyState title={t("payNoMethods")} icon={Wallet} />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {visible.map((method) => (
        <PaymentMethodCard key={method.id} method={method} />
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

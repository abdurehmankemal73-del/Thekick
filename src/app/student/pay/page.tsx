"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { PaymentMethodCards } from "@/components/payment-methods";
import { PaymentProofForm } from "@/components/payment-proof";
import { EmptyState, Skeleton } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";
import { DEFAULT_PAYMENT_METHODS, PAYMENT_FEE_LABEL } from "@/lib/constants";
import type { ClubSettings } from "@/db/schema";

export default function StudentPayPage() {
  const { t } = useI18n();
  const [methods, setMethods] = useState<ClubSettings["paymentMethods"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ settings: ClubSettings }>("/api/settings")
      .then((res) => setMethods(res.settings.paymentMethods ?? DEFAULT_PAYMENT_METHODS))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <PageTitle icon={Wallet}>{t("payTitle")}</PageTitle>
        <p className="mt-1 text-muted">{t("payLead")}</p>
        <p className="mt-3 inline-flex items-baseline gap-2 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t("payAmountLabel")}</span>
          <span className="font-display text-2xl text-red">{PAYMENT_FEE_LABEL}</span>
        </p>
      </div>
      {error ? (
        <EmptyState title={error} icon={Wallet} />
      ) : !methods ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <PaymentMethodCards methods={methods} />
          <PaymentProofForm />
        </>
      )}
    </div>
  );
}

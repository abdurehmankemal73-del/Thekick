"use client";

import { Wallet } from "lucide-react";
import { PaymentMethodCards } from "@/components/payment-methods";
import { PaymentProofForm } from "@/components/payment-proof";
import { PageTitle } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";
import { DEFAULT_PAYMENT_METHODS, PAYMENT_FEE_LABEL } from "@/lib/constants";
import type { PaymentMethod } from "@/db/schema";

export function PayView({ methods }: { methods: PaymentMethod[] | null | undefined }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red">{t("navPay")}</p>
      <PageTitle icon={Wallet} className="mt-3 text-4xl">
        {t("payTitle")}
      </PageTitle>
      <p className="mt-4 max-w-2xl text-muted">{t("payLead")}</p>
      <p className="mt-6 inline-flex items-baseline gap-2 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t("payAmountLabel")}</span>
        <span className="font-display text-3xl text-red">{PAYMENT_FEE_LABEL}</span>
      </p>
      <div className="mt-10">
        <PaymentMethodCards methods={methods ?? DEFAULT_PAYMENT_METHODS} />
      </div>
      <PaymentProofForm />
    </div>
  );
}

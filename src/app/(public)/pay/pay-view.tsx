"use client";

import { Clock } from "lucide-react";
import { PayFlow } from "@/components/pay-flow";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";
import { DEFAULT_PAYMENT_METHODS, PAYMENT_FEE_LABEL } from "@/lib/constants";
import type { PaymentMethod } from "@/db/schema";

export function PayView({
  methods,
  pending = false,
  proofSubmittedAt = null,
  paymentsEnabled = true,
}: {
  methods: PaymentMethod[] | null | undefined;
  pending?: boolean;
  proofSubmittedAt?: string | null;
  paymentsEnabled?: boolean;
}) {
  const { t } = useI18n();
  const list = methods ?? DEFAULT_PAYMENT_METHODS;

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-bg text-cream">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(200,16,46,0.38),_transparent_50%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(201,162,39,0.16),_transparent_45%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            {t("navPay")}
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl">{t("payTitle")}</h1>
          <p className="mt-4 max-w-2xl text-cream/75">{t("payLead")}</p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <p className="inline-flex items-baseline gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-3 backdrop-blur">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">
                {t("payAmountLabel")}
              </span>
              <span className="font-display text-3xl text-gold sm:text-4xl">
                {PAYMENT_FEE_LABEL}
              </span>
            </p>
          </div>

          {pending ? (
            <p className="mt-6 flex max-w-2xl items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100">
              <Icon icon={Clock} className="mt-0.5 shrink-0 text-amber-300" />
              {t("payProofWaiting")}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <PayFlow
          methods={list}
          pending={pending}
          proofSubmittedAt={proofSubmittedAt}
          paymentsEnabled={paymentsEnabled}
        />
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Clock, Copy, ShieldCheck, Upload, Wallet } from "lucide-react";
import { PaymentMethodCards } from "@/components/payment-methods";
import { PaymentProofForm } from "@/components/payment-proof";
import { Icon, SectionTitle } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";
import type { MessageKey } from "@/i18n/messages";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/db/schema";

type StepState = "todo" | "current" | "done" | "waiting";

/**
 * The full payment experience, shared by the public /pay page and the student
 * pay page: a three-step guide that reacts to what the visitor has actually
 * done (copied an account number, uploaded a receipt), the account cards and
 * the receipt form.
 */
export function PayFlow({
  methods,
  pending: pendingFromServer,
  proofSubmittedAt = null,
  paymentsEnabled = true,
}: {
  methods: PaymentMethod[];
  pending?: boolean;
  proofSubmittedAt?: string | null;
  paymentsEnabled?: boolean;
}) {
  const { t } = useI18n();
  const { data } = useSession();
  const sessionPending =
    data?.user?.role === "STUDENT" && data.user.accountStatus === "PENDING";
  const pending = pendingFromServer ?? Boolean(sessionPending);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<string | null>(proofSubmittedAt);

  if (!paymentsEnabled) {
    return (
      <div className="rounded-xl border border-line bg-white p-6 text-muted">
        {t("paymentsDisabledMessage")}
      </div>
    );
  }

  const steps: { label: MessageKey; icon: typeof Copy; state: StepState }[] = [
    { label: "payStep1", icon: Copy, state: copiedId ? "done" : "current" },
    { label: "payStep2", icon: Upload, state: sentAt ? "done" : pending && copiedId ? "current" : "todo" },
    { label: "payStep3", icon: ShieldCheck, state: sentAt ? (pending ? "waiting" : "done") : "todo" },
  ];

  return (
    <div>
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.label}
            aria-current={step.state === "current" ? "step" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition",
              step.state === "current" && "border-gold ring-1 ring-gold/40",
              step.state === "done" && "border-emerald-300",
              step.state === "waiting" && "border-amber-300",
              step.state === "todo" && "border-line",
            )}
          >
            <span
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                step.state === "done" && "bg-emerald-100 text-emerald-700",
                step.state === "current" && "bg-red text-white",
                step.state === "waiting" && "bg-amber-100 text-amber-700",
                step.state === "todo" && "bg-surface text-muted",
              )}
            >
              <Icon
                icon={step.state === "done" ? Check : step.state === "waiting" ? Clock : step.icon}
              />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                {t("payStepLabel").replace("{n}", String(index + 1))}
              </p>
              <p
                className={cn(
                  "mt-0.5 truncate text-sm font-semibold",
                  step.state === "todo" ? "text-muted" : "text-ink",
                )}
              >
                {t(step.label)}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <SectionTitle icon={Wallet}>{t("payMethods")}</SectionTitle>
        <div className="mt-4">
          <PaymentMethodCards
            methods={methods}
            onCopied={(method) => setCopiedId(method.id)}
            highlightId={copiedId}
          />
        </div>
      </div>

      <PaymentProofForm
        pending={pending}
        proofSubmittedAt={proofSubmittedAt}
        onSubmitted={setSentAt}
      />
    </div>
  );
}

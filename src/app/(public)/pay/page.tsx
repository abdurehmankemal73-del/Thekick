import type { Metadata } from "next";
import { CLUB } from "@/lib/constants";
import { getSessionUser } from "@/lib/guards";
import { getClubSettings } from "@/lib/queries";
import { PayView } from "./pay-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pay",
  description: `How to pay club fees at ${CLUB.fullName}.`,
};

export default async function PayPage() {
  let methods = null;
  let settings: Awaited<ReturnType<typeof getClubSettings>> | null = null;
  try {
    settings = await getClubSettings();
    methods = settings.paymentMethods;
  } catch {
    methods = null;
    settings = null;
  }

  const user = await getSessionUser().catch(() => null);
  const pending = user?.role === "STUDENT" && user.accountStatus === "PENDING";

  const paymentsEnabled = settings?.paymentsEnabled ?? true;

  return (
    <PayView
      methods={methods}
      pending={Boolean(pending)}
      proofSubmittedAt={pending ? user?.paymentProofSubmittedAt?.toISOString() ?? null : null}
      paymentsEnabled={paymentsEnabled}
    />
  );
}

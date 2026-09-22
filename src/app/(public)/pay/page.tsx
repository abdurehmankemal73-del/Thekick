import type { Metadata } from "next";
import { CLUB } from "@/lib/constants";
import { getClubSettings } from "@/lib/queries";
import { PayView } from "./pay-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pay",
  description: `How to pay club fees at ${CLUB.fullName}.`,
};

export default async function PayPage() {
  let methods = null;
  try {
    const settings = await getClubSettings();
    methods = settings.paymentMethods;
  } catch {
    methods = null;
  }

  return <PayView methods={methods} />;
}

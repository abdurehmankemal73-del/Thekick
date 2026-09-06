"use client";

import Link from "next/link";
import { Home, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";

export default function OfflinePage() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Icon icon={WifiOff} size="md" className="text-red" />
      <h1 className="mt-3 text-4xl">{t("offlineTitle")}</h1>
      <p className="mt-3 max-w-md text-muted">{t("offlineBody")}</p>
      <Button asChild className="mt-6">
        <Link href="/">
          <Icon icon={Home} />
          {t("backHome")}
        </Link>
      </Button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-red">404</p>
      <h1 className="mt-3 text-4xl">{t("pageNotFound")}</h1>
      <p className="mt-3 text-muted">{t("pageNotFoundBody")}</p>
      <Button asChild className="mt-6">
        <Link href="/">
          <Icon icon={Home} />
          {t("backHome")}
        </Link>
      </Button>
    </div>
  );
}

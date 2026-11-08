"use client";

import { Globe } from "lucide-react";
import { LOCALES, LOCALE_META } from "@/i18n/messages";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import type { Locale } from "@/i18n/messages";

export function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="relative inline-flex items-center">
      <Icon
        icon={Globe}
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2",
          light ? "text-gold" : "text-muted",
        )}
      />
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        aria-label={t("language")}
        className={cn(
          "h-11 min-w-[6.5rem] appearance-none rounded-md border bg-transparent pl-9 pr-8 text-sm font-semibold transition focus-visible:outline-none",
          light
            ? "border-white/20 text-cream hover:border-gold focus:border-gold"
            : "border-line text-ink hover:border-red focus:border-red",
        )}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_META[code].short} · {LOCALE_META[code].name}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs",
          light ? "text-cream/60" : "text-muted",
        )}
      >
        ▾
      </span>
    </div>
  );
}

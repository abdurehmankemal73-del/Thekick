"use client";

import { Globe } from "lucide-react";
import { LOCALES, LOCALE_META } from "@/i18n/messages";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "inline-flex max-w-[min(100%,11.5rem)] shrink-0 items-center gap-0.5 overflow-x-auto rounded-md border p-0.5 text-[10px] font-semibold sm:max-w-none sm:gap-1 sm:text-xs",
        light ? "border-white/20" : "border-line",
      )}
    >
      <Icon icon={Globe} className={cn("ml-0.5 hidden sm:inline sm:ml-1", light ? "text-gold" : "text-muted")} />
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          title={LOCALE_META[code].name}
          className={cn(
            "rounded px-1 py-1 leading-none transition sm:px-1.5",
            locale === code
              ? light
                ? "bg-gold text-bg"
                : "bg-red text-white"
              : light
                ? "text-cream/80 hover:text-gold"
                : "text-muted hover:text-ink",
          )}
        >
          {LOCALE_META[code].short}
        </button>
      ))}
    </div>
  );
}

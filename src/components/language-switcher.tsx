"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LOCALES, LOCALE_META } from "@/i18n/messages";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import type { Locale } from "@/i18n/messages";

export function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={t("language")}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-none",
            light
              ? "border-white/20 text-cream hover:border-gold focus:border-gold"
              : "border-line text-ink hover:border-red focus:border-red",
          )}
        >
          <Icon icon={Globe} className={light ? "text-gold" : "text-muted"} />
          <span className="min-w-[2ch]">{LOCALE_META[locale].short}</span>
          <Icon icon={ChevronDown} className={light ? "text-cream/60" : "text-muted"} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className={cn(
            "z-50 min-w-[12rem] overflow-hidden rounded-xl border p-1 shadow-[0_18px_40px_-18px_rgba(11,11,12,0.45)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            light ? "border-white/15 bg-bg text-cream" : "border-line bg-white text-ink",
          )}
        >
          {LOCALES.map((code) => (
            <DropdownMenu.Item
              key={code}
              onSelect={() => setLocale(code as Locale)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition",
                light
                  ? "text-cream/80 hover:bg-white/10 hover:text-cream focus:bg-white/10 focus:text-cream"
                  : "text-ink hover:bg-surface focus:bg-surface",
              )}
            >
              <span>{LOCALE_META[code as Locale].name}</span>
              {locale === code ? (
                <Icon icon={Check} className={light ? "text-gold" : "text-red"} />
              ) : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

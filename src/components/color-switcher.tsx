"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/theme/provider";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export function ColorSwitcher({
  light = false,
  className,
}: {
  light?: boolean;
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const isMint = theme === "mint";

  return (
    <button
      type="button"
      aria-label={t("color")}
      title={t("color")}
      onClick={toggleTheme}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border transition",
        light
          ? "border-white/20 text-cream hover:border-gold hover:text-gold"
          : "border-line text-ink hover:border-red hover:text-red",
        className,
      )}
    >
      <Icon icon={isMint ? Sun : Moon} />
    </button>
  );
}

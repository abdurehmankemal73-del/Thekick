"use client";

import { Clock } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export function TrainingScheduleTable({ light = false }: { light?: boolean }) {
  const { t } = useI18n();
  const rows = [
    { day: t("dayMonday"), period: t("morning"), clock: t("time530am") },
    { day: t("dayWednesday"), period: t("morning"), clock: t("time530am") },
    { day: t("dayFriday"), period: t("morning"), clock: t("time530am") },
    { day: t("daySaturday"), period: t("evening"), clock: t("time930pm") },
  ];

  return (
    <div
      className={cn(
        "mt-5 overflow-hidden rounded-xl",
        light ? "bg-surface ring-1 ring-line" : "bg-black/20 ring-1 ring-white/10",
      )}
    >
      <div
        className={cn(
          "grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em]",
          light ? "bg-white text-muted" : "bg-white/5 text-cream/45",
        )}
      >
        <span>{t("dayHeader")}</span>
        <span className="inline-flex items-center gap-1.5">
          <Icon icon={Clock} className="text-gold" />
          {t("timeHeader")}
        </span>
      </div>
      <ul>
        {rows.map((row, index) => (
          <li
            key={row.day}
            className={cn(
              "grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3.5",
              index > 0 && (light ? "border-t border-line/80" : "border-t border-white/10"),
            )}
          >
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
              <span className={cn("font-display text-sm tracking-[0.08em]", light ? "text-ink" : "text-cream")}>
                {row.day}
              </span>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-[0.18em]",
                  light ? "text-muted" : "text-cream/45",
                )}
              >
                {row.period}
              </p>
              {row.clock ? (
                <p className={cn("mt-0.5 text-sm font-semibold tabular-nums", light ? "text-red" : "text-gold")}>
                  {row.clock}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

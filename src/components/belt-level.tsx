"use client";

import { useState } from "react";
import type { BeltLevel } from "@/db/schema";
import { BELT_LEVELS, BELT_VISUALS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/fields";
import { useI18n } from "@/i18n/provider";

const SIZES = {
  sm: { className: "h-3 w-10", width: 40, height: 12 },
  md: { className: "h-4 w-14", width: 56, height: 16 },
  lg: { className: "h-6 w-20", width: 80, height: 24 },
} as const;

export function BeltMark({
  belt,
  size = "md",
  className,
}: {
  belt: BeltLevel;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const visual = BELT_VISUALS[belt];
  const preset = SIZES[size];

  return (
    <svg
      aria-hidden
      viewBox="0 0 72 18"
      width={preset.width}
      height={preset.height}
      className={cn("shrink-0", preset.className, className)}
    >
      <rect
        x="1.25"
        y="3.25"
        width="69.5"
        height="11.5"
        rx="5.75"
        fill={visual.fill}
        stroke={visual.stroke}
        strokeWidth="1.5"
      />
      {visual.stripe ? (
        <rect x="54" y="3.25" width="10" height="11.5" rx="1.5" fill={visual.stripe} />
      ) : null}
    </svg>
  );
}

export function BeltLevelList({
  name = "beltLevel",
  defaultValue,
  value,
  onChange,
  required,
  labelledBy,
  describedBy,
  className,
}: {
  name?: string;
  defaultValue?: BeltLevel | "";
  value?: BeltLevel | "";
  onChange?: (belt: BeltLevel) => void;
  required?: boolean;
  labelledBy?: string;
  describedBy?: string;
  className?: string;
}) {
  const { t, tBelt } = useI18n();
  const controlled = value !== undefined;
  const [internal, setInternal] = useState<BeltLevel | "">(defaultValue ?? "");
  const selectedBelt = controlled ? value : internal;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {selectedBelt ? <BeltMark belt={selectedBelt} size="lg" /> : null}
      <Select
        id={name}
        name={name}
        required={required}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        value={controlled ? value : selectedBelt}
        onChange={(event) => {
          const next = event.target.value as BeltLevel | "";
          if (!controlled) setInternal(next);
          if (next) onChange?.(next);
        }}
      >
        <option value="" disabled={required}>
          {t("selectBelt")}
        </option>
        {BELT_LEVELS.map((belt) => (
          <option key={belt} value={belt}>
            {tBelt(belt)}
          </option>
        ))}
      </Select>
    </div>
  );
}

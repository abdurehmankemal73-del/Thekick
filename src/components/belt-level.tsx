"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { BeltLevel } from "@/db/schema";
import { BELT_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

type BeltVisual = {
  fill: string;
  stroke: string;
  stripe?: string;
};

const BELT_VISUAL: Record<BeltLevel, BeltVisual> = {
  WHITE: { fill: "#f4f4f5", stroke: "#71717a" },
  WHITE_YELLOW_TAG: { fill: "#f4f4f5", stroke: "#71717a", stripe: "#eab308" },
  YELLOW: { fill: "#eab308", stroke: "#a16207" },
  YELLOW_GREEN_TAG: { fill: "#eab308", stroke: "#a16207", stripe: "#15803d" },
  GREEN: { fill: "#15803d", stroke: "#14532d" },
  GREEN_BLUE_TAG: { fill: "#15803d", stroke: "#14532d", stripe: "#1d4ed8" },
  BLUE: { fill: "#1d4ed8", stroke: "#1e3a8a" },
  BLUE_RED_TAG: { fill: "#1d4ed8", stroke: "#1e3a8a", stripe: "#c8102e" },
  RED: { fill: "#c8102e", stroke: "#9b0c23" },
  RED_BLACK_TAG: { fill: "#c8102e", stroke: "#9b0c23", stripe: "#171717" },
  BLACK: { fill: "#171717", stroke: "#0a0a0a" },
  DAN_1: { fill: "#171717", stroke: "#0a0a0a" },
};

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
  const visual = BELT_VISUAL[belt];
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
  const { tBelt } = useI18n();
  const controlled = value !== undefined;
  const [internal, setInternal] = useState<BeltLevel | "">(defaultValue ?? "");
  const selectedBelt = controlled ? value : internal;

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-required={required || undefined}
      className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", className)}
    >
      {BELT_LEVELS.map((belt) => {
        const selected = selectedBelt === belt;
        return (
          <label
            key={belt}
            className={cn(
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 py-3 text-ink shadow-sm transition",
              "hover:border-red/40 hover:shadow",
              selected
                ? "border-red bg-red/5 ring-2 ring-red"
                : "border-line",
            )}
          >
            <input
              type="radio"
              name={name}
              value={belt}
              required={required}
              checked={selected}
              onChange={() => {
                if (!controlled) setInternal(belt);
                onChange?.(belt);
              }}
              className="sr-only"
            />
            <BeltMark belt={belt} size="lg" />
            <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{tBelt(belt)}</span>
            <span
              className={cn(
                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                selected ? "border-red bg-red text-white" : "border-line text-transparent",
              )}
              aria-hidden
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </label>
        );
      })}
    </div>
  );
}

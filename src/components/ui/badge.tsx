"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import type { BeltLevel } from "@/db/schema";
import { BeltMark } from "@/components/belt-level";

export function Badge({
  className,
  children,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function BeltBadge({ belt }: { belt: BeltLevel | null | undefined }) {
  const { tBelt } = useI18n();
  if (!belt) return <Badge className="border-line text-muted">{tBelt(null)}</Badge>;
  return (
    <Badge className="gap-2 border-line bg-white font-medium text-ink">
      <BeltMark belt={belt} size="sm" />
      {tBelt(belt)}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { tStatus } = useI18n();
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-900 border-amber-300",
    ACTIVE: "bg-emerald-100 text-emerald-900 border-emerald-300",
    APPROVED: "bg-emerald-100 text-emerald-900 border-emerald-300",
    PUBLISHED: "bg-emerald-100 text-emerald-900 border-emerald-300",
    SUSPENDED: "bg-red-100 text-red-900 border-red-300",
    REJECTED: "bg-red-100 text-red-900 border-red-300",
    DRAFT: "bg-neutral-100 text-neutral-700 border-neutral-300",
    NEW: "bg-blue-100 text-blue-900 border-blue-300",
    READ: "bg-neutral-100 text-neutral-700 border-neutral-300",
  };
  return (
    <Badge className={map[status] ?? "border-line"}>
      {tStatus(status)}
    </Badge>
  );
}

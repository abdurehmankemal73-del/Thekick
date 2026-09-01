import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Icon({
  icon: Glyph,
  className,
  size = "sm",
}: {
  icon: LucideIcon;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <Glyph
      aria-hidden
      strokeWidth={1.75}
      className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5", "shrink-0", className)}
    />
  );
}

export function PageTitle({
  icon,
  children,
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1 className={cn("flex flex-wrap items-center gap-2.5 text-3xl", className)}>
      <Icon icon={icon} size="md" className="text-gold" />
      <span>{children}</span>
    </h1>
  );
}

export function SectionTitle({
  icon,
  children,
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("flex items-center gap-2 text-lg", className)}>
      <Icon icon={icon} className="text-gold" />
      <span>{children}</span>
    </h2>
  );
}

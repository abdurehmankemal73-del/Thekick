import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export function EmptyState({
  title,
  description,
  className,
  icon = Inbox,
}: {
  title: string;
  description?: string;
  className?: string;
  icon?: LucideIcon;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold">
        <Icon icon={icon} />
      </span>
      <p className="font-display text-lg">{title}</p>
      {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-line", className)} />;
}

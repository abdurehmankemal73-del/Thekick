import Image from "next/image";
import { CLUB } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SIZES = {
  header: {
    className: "h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12",
    sizes: "(min-width: 768px) 48px, (min-width: 640px) 44px, 40px",
  },
  footer: {
    className: "h-9 w-9 sm:h-10 sm:w-10",
    sizes: "(min-width: 640px) 40px, 36px",
  },
} as const;

export function Logo({
  className,
  size = "header",
  light = false,
}: {
  className?: string;
  size?: keyof typeof SIZES;
  light?: boolean;
}) {
  const preset = SIZES[size];

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5 sm:gap-3", className)}>
      <Image
        src="/logo.jpg"
        alt=""
        width={512}
        height={512}
        priority={size === "header"}
        sizes={preset.sizes}
        className={cn("shrink-0 rounded-md object-contain", preset.className)}
      />
      <span
        className={cn(
          "flex min-w-0 flex-col justify-center overflow-hidden leading-tight",
          light ? "text-cream" : "text-ink",
        )}
      >
        <span
          className={cn(
            "font-display text-[11px] tracking-[0.08em] sm:text-xs md:text-[13px]",
            size === "footer" && "sm:text-[13px]",
          )}
        >
          JJU {CLUB.shortName}
        </span>
        <span
          className={cn(
            "mt-0.5 text-[8px] font-medium uppercase tracking-[0.14em] sm:text-[9px] md:text-[10px]",
            light ? "text-cream/70" : "text-ink/65",
          )}
        >
          INTERNATIONAL TAEKWONDO CLUB
        </span>
      </span>
    </span>
  );
}

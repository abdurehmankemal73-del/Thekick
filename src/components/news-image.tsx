"use client";

import { useEffect, useState } from "react";
import { ImageOff, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

export function NewsImage({
  src,
  alt = "",
  className,
  fallbackClassName,
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-surface text-gold",
          fallbackClassName,
        )}
        role="img"
        aria-label={alt || undefined}
      >
        {failed ? <ImageOff className="h-8 w-8 text-muted" /> : <Megaphone className="h-8 w-8" />}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

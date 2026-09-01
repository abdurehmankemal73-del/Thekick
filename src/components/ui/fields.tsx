"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff, Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import { Icon } from "@/components/ui/icon";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-muted",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-ink", className)} {...props} />
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-red" role="alert">
      {message}
    </p>
  );
}

export function InputWithIcon({
  icon,
  className,
  ...props
}: ComponentProps<"input"> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon
        icon={icon}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold"
      />
      <Input className={cn("pl-10", className)} {...props} />
    </div>
  );
}

export function SearchField({ className, ...props }: ComponentProps<"input">) {
  return <InputWithIcon icon={Search} type="search" className={className} {...props} />;
}

export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
        autoComplete={props.autoComplete ?? "current-password"}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-muted hover:text-ink"
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        title={visible ? t("hidePassword") : t("showPassword")}
      >
        <Icon icon={visible ? EyeOff : Eye} />
      </button>
    </div>
  );
}

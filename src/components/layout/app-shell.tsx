"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SiteControls } from "@/components/site-controls";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import { CLUB } from "@/lib/constants";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export function AppShell({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    toast.success(t("signedOut"));
    router.push("/");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label={title}>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-cream/75 hover:bg-white/10 hover:text-cream",
              active && "bg-red text-white hover:bg-red",
            )}
          >
            <Icon icon={item.icon} className={active ? "text-white" : "text-gold"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-bg p-4 text-cream md:flex">
        <Link href="/" className="mb-8 inline-flex min-w-0 items-center" aria-label={CLUB.fullName}>
          <Logo size="header" light />
        </Link>
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold">{title}</p>
        {nav}
        <div className="mt-4 space-y-3">
          <SiteControls light />
          <Button variant="ghost" className="w-full justify-start text-cream hover:bg-white/10" onClick={logout}>
            <Icon icon={LogOut} />
            {t("logout")}
          </Button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-line bg-white px-4 md:hidden">
          <Link href="/" aria-label={CLUB.fullName} className="inline-flex min-w-0 max-w-[70%] items-center">
            <Logo size="header" />
          </Link>
          <div className="flex items-center gap-2">
            <SiteControls />
            <button aria-label={t("openMenu")} onClick={() => setOpen(true)}>
              <Icon icon={Menu} size="md" />
            </button>
          </div>
        </header>
        {open ? (
          <div className="fixed inset-0 z-50 bg-bg p-4 md:hidden">
            <div className="mb-6 flex items-center justify-between">
              <Link href="/" aria-label={CLUB.fullName} className="inline-flex min-w-0 items-center">
                <Logo size="header" light />
              </Link>
              <button aria-label={t("closeMenu")} onClick={() => setOpen(false)} className="text-cream">
                <Icon icon={X} size="md" />
              </button>
            </div>
            {nav}
            <div className="mt-6 space-y-3">
              <SiteControls light />
              <Button variant="gold" className="w-full" onClick={logout}>
                <Icon icon={LogOut} />
                {t("logout")}
              </Button>
            </div>
          </div>
        ) : null}
        <div className="px-4 py-6 md:px-8">{children}</div>
      </div>
    </div>
  );
}

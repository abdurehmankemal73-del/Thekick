"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { CalendarDays, Home, Info, LayoutDashboard, LogIn, Mail, Megaphone, Menu, UserPlus, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ColorSwitcher } from "@/components/color-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { CLUB } from "@/lib/constants";

export function PublicHeader() {
  const pathname = usePathname();
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const menuId = useId();
  const dashboard =
    data?.user?.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard";

  const links = [
    { href: "/", label: t("navHome"), icon: Home },
    { href: "/about", label: t("navAbout"), icon: Info },
    { href: "/contact", label: t("navContact"), icon: Mail },
    { href: "/calendar", label: t("navCalendar"), icon: CalendarDays },
    { href: "/news", label: t("navNews"), icon: Megaphone },
  ];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-bg/95 text-cream backdrop-blur">
      <div className="mx-auto flex h-16 min-w-0 max-w-6xl items-center gap-2 px-4 sm:h-[4.25rem] sm:gap-3">
        <Link
          href="/"
          aria-label={CLUB.fullName}
          className="inline-flex min-w-0 flex-1 items-center overflow-hidden"
        >
          <Logo size="header" light />
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ColorSwitcher light className="h-11 w-11" />
          <LanguageSwitcher light />
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/20 text-cream transition hover:border-gold hover:text-gold"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            <Icon icon={open ? X : Menu} size="md" />
          </button>
        </div>
      </div>

      {open ? (
        <button
          type="button"
          aria-label={t("closeMenu")}
          className="fixed inset-0 top-16 z-30 bg-bg/55 sm:top-[4.25rem]"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <nav
            id={menuId}
            aria-label="Main"
            aria-hidden={!open}
            inert={!open ? true : undefined}
            className="relative z-40 border-t border-white/10 bg-bg px-4 py-4 shadow-lg"
          >
            <div className="mx-auto max-w-6xl space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-cream/80 transition hover:bg-white/10 hover:text-gold",
                    pathname === link.href && "bg-white/10 text-gold",
                  )}
                  onClick={() => setOpen(false)}
                >
                  <Icon icon={link.icon} className="text-gold" />
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-3 sm:flex-row">
                {data?.user ? (
                  <Button asChild className="h-12 min-h-12 w-full justify-center sm:w-auto">
                    <Link href={dashboard} onClick={() => setOpen(false)}>
                      <Icon icon={LayoutDashboard} />
                      {t("dashboard")}
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="ghost" className="h-12 min-h-12 w-full justify-center text-cream hover:bg-white/10 sm:w-auto">
                      <Link href="/login" onClick={() => setOpen(false)}>
                        <Icon icon={LogIn} />
                        {t("studentLogin")}
                      </Link>
                    </Button>
                    <Button asChild className="h-12 min-h-12 w-full justify-center sm:w-auto">
                      <Link href="/register" onClick={() => setOpen(false)}>
                        <Icon icon={UserPlus} />
                        {t("joinKick")}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

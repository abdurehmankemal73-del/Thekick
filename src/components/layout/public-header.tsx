"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CalendarDays,
  Download,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  Mail,
  Megaphone,
  Menu,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ColorSwitcher } from "@/components/color-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { isStandaloneDisplay, requestInstallHelp } from "@/components/pwa";
import { CLUB } from "@/lib/constants";

/** Scroll position that flips the header into its condensed, shadowed state. */
function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}
function readScrolled() {
  return window.scrollY > 8;
}

/** App-install availability follows the display mode; it never changes on the server. */
function subscribeDisplayMode(onChange: () => void) {
  const queries = ["(display-mode: standalone)", "(display-mode: fullscreen)"].map((query) =>
    window.matchMedia(query),
  );
  for (const query of queries) query.addEventListener("change", onChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
  };
}
function readInstallable() {
  return !isStandaloneDisplay();
}

export function PublicHeader() {
  const pathname = usePathname();
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const { t } = useI18n();
  const menuId = useId();
  const scrolled = useSyncExternalStore(subscribeScroll, readScrolled, () => false);
  const canInstall = useSyncExternalStore(subscribeDisplayMode, readInstallable, () => false);
  const dashboard =
    data?.user?.accountStatus === "PENDING"
      ? "/pay"
      : data?.user?.role === "ADMIN"
        ? "/admin/dashboard"
        : "/student/dashboard";

  const links = [
    { href: "/", label: t("navHome"), icon: Home },
    { href: "/about", label: t("navAbout"), icon: Info },
    { href: "/contact", label: t("navContact"), icon: Mail },
    { href: "/pay", label: t("navPay"), icon: Wallet },
    { href: "/calendar", label: t("navCalendar"), icon: CalendarDays },
    { href: "/news", label: t("navNews"), icon: Megaphone },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  // Close the menu on navigation; adjusting state during render avoids an
  // extra effect round-trip (React's "adjust state when props change").
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

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

  const authCta = data?.user ? (
    <Button
      asChild
      variant={data.user.accountStatus === "PENDING" ? "gold" : "dark"}
      className={cn(
        "h-11 min-h-11",
        data.user.accountStatus === "PENDING"
          ? ""
          : "border border-white/20 text-cream hover:border-gold hover:text-gold",
      )}
    >
      <Link href={dashboard} onClick={() => setOpen(false)}>
        <Icon icon={data.user.accountStatus === "PENDING" ? Wallet : LayoutDashboard} />
        {data.user.accountStatus === "PENDING" ? t("navPay") : t("dashboard")}
      </Link>
    </Button>
  ) : (
    <>
      <Button
        asChild
        variant="ghost"
        className="h-11 min-h-11 border border-white/20 text-cream hover:bg-white/10 hover:text-gold"
      >
        <Link href="/login" onClick={() => setOpen(false)}>
          <Icon icon={LogIn} />
          {t("studentLogin")}
        </Link>
      </Button>
      <Button asChild className="h-11 min-h-11 bg-red text-white hover:bg-red-dark">
        <Link href="/register" onClick={() => setOpen(false)}>
          <Icon icon={UserPlus} />
          {t("joinKick")}
        </Link>
      </Button>
    </>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-bg/95 text-cream backdrop-blur transition-all duration-300",
        scrolled
          ? "border-white/15 bg-bg shadow-[0_12px_32px_-18px_rgba(0,0,0,0.7)]"
          : "border-white/10 shadow-none",
      )}
    >
      <div className="mx-auto flex h-16 min-w-0 max-w-6xl items-center gap-2 px-4 sm:h-[4.25rem] sm:gap-3">
        <Link
          href="/"
          aria-label={CLUB.fullName}
          className="inline-flex min-w-0 flex-1 items-center overflow-hidden lg:flex-none"
        >
          <Logo size="header" light />
        </Link>

        {/* Desktop navigation: inline links with an animated active marker. */}
        <nav aria-label="Main" className="hidden min-w-0 items-center gap-1 lg:flex">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                  active ? "text-gold" : "text-cream/75 hover:text-cream",
                )}
              >
                <Icon icon={link.icon} className={active ? "text-gold" : "text-cream/50"} />
                {link.label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-2 bottom-0.5 h-0.5 rounded-full bg-gold transition-transform duration-300 ease-out",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ColorSwitcher light className="h-11 w-11" />
          <LanguageSwitcher light />
          {canInstall ? (
            <button
              type="button"
              title={t("installApp")}
              aria-label={t("installApp")}
              className="hidden h-11 w-11 items-center justify-center rounded-md border border-white/20 text-cream transition hover:border-gold hover:text-gold lg:inline-flex"
              onClick={() => void requestInstallHelp()}
            >
              <Icon icon={Download} size="md" />
            </button>
          ) : null}
          <div className="hidden items-center gap-2 lg:flex">{authCta}</div>

          {/* Mobile menu trigger (the desktop nav replaces it from lg up). */}
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/20 text-cream transition hover:border-gold hover:text-gold lg:hidden"
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
          "grid transition-[grid-template-rows] duration-300 ease-out lg:hidden",
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
              {links.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={cn(
                    "menu-in flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive(link.href)
                      ? "bg-white/10 text-gold"
                      : "text-cream/80 hover:bg-white/10 hover:text-gold",
                  )}
                  onClick={() => setOpen(false)}
                >
                  <Icon
                    icon={link.icon}
                    className={isActive(link.href) ? "text-gold" : "text-cream/50"}
                  />
                  {link.label}
                </Link>
              ))}
              {canInstall ? (
                <button
                  type="button"
                  style={{ animationDelay: `${links.length * 40}ms` }}
                  className="menu-in flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-cream/80 transition hover:bg-white/10 hover:text-gold"
                  onClick={() => {
                    setOpen(false);
                    void requestInstallHelp();
                  }}
                >
                  <Icon icon={Download} className="text-gold" />
                  {t("installApp")}
                </button>
              ) : null}
              <div
                className="menu-in flex flex-col gap-2 pt-3 sm:flex-row"
                style={{ animationDelay: `${(links.length + 1) * 40}ms` }}
              >
                {authCta}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

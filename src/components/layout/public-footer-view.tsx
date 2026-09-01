"use client";

import Link from "next/link";
import { CalendarDays, Home, Info, LogIn, Mail, MapPin, Megaphone, Phone, UserPlus } from "lucide-react";
import { CLUB, FOOTER_CONTACT } from "@/lib/constants";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";

export function PublicFooterView() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const explore = [
    { href: "/", label: t("navHome"), icon: Home },
    { href: "/about", label: t("navAbout"), icon: Info },
    { href: "/news", label: t("navNews"), icon: Megaphone },
    { href: "/calendar", label: t("navCalendar"), icon: CalendarDays },
    { href: "/contact", label: t("navContact"), icon: Mail },
    { href: "/register", label: t("joinKick"), icon: UserPlus },
    { href: "/login", label: t("studentLogin"), icon: LogIn },
  ];

  const contacts = [
    {
      icon: MapPin,
      label: t("location"),
      value: FOOTER_CONTACT.location,
      href: "https://maps.google.com/?q=Jigjiga+University",
    },
    {
      icon: Mail,
      label: t("email"),
      value: FOOTER_CONTACT.email,
      href: `mailto:${FOOTER_CONTACT.email}`,
    },
    {
      icon: Phone,
      label: t("phone"),
      value: FOOTER_CONTACT.phoneDisplay,
      href: `tel:${FOOTER_CONTACT.tel}`,
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-bg text-cream">
      <div className="absolute inset-x-0 top-0 h-1 bg-red" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-red/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-red/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo size="footer" light />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-red">
            {CLUB.federationShort} Taekwon-Do
          </p>
        </div>

        <div>
          <p className="font-display text-sm text-cream">{t("navigate")}</p>
          <div className="mt-2 h-0.5 w-10 bg-red" />
          <nav className="mt-5 flex flex-col gap-2.5 text-sm" aria-label={t("navigate")}>
            {explore.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 text-cream/75 transition hover:translate-x-0.5 hover:text-red"
              >
                <Icon icon={link.icon} className="text-gold" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="font-display text-sm text-cream">{t("contactEyebrow")}</p>
          <div className="mt-2 h-0.5 w-10 bg-red" />
          <ul className="mt-5 space-y-4">
            {contacts.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="group flex items-start gap-3 text-sm text-cream/80 transition hover:text-cream"
                  {...(item.href.startsWith("http")
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-gold group-hover:border-gold/40 group-hover:bg-gold/10">
                    <Icon icon={item.icon} />
                  </span>
                  <span>
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-cream/45">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block break-all">{item.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-bg-elevated/80 p-6">
          <p className="font-display text-lg leading-snug">{t("joinKick")}</p>
          <p className="mt-3 text-sm leading-6 text-cream/70">{t("heroTag")}</p>
          <Button asChild className="mt-6 w-full">
            <Link href="/register">
              <Icon icon={UserPlus} />
              {t("joinKick")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-center text-xs text-cream/45 sm:flex-row sm:text-left">
          <p>
            © {year} {CLUB.shortName}. {t("allRights")}
          </p>
          <p className="uppercase tracking-[0.2em] text-cream/35">
            {CLUB.federationShort} · Jigjiga
          </p>
        </div>
      </div>
    </footer>
  );
}

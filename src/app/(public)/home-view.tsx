"use client";

import Image from "next/image";
import Link from "next/link";
import { Award, Building2, CalendarClock, Dumbbell, GraduationCap, Handshake, Heart, Info, LogIn, Megaphone, Shield, UserPlus } from "lucide-react";
import { CLUB } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon, SectionTitle } from "@/components/ui/icon";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import { TrainingScheduleTable } from "@/components/training-schedule-table";

type Announcement = {
  id: string;
  title: string;
  content: string;
  createdAt: Date | string;
};

type Settings = {
  about: string | null;
  location: string | null;
  schedule: string | null;
} | null;

export function HomeView({
  settings,
  announcements,
}: {
  settings: Settings;
  announcements: Announcement[];
}) {
  const { locale, t } = useI18n();
  const about = locale === "en" ? (settings?.about ?? t("aboutBody")) : t("aboutBody");
  const benefits = [
    { title: t("benefit1Title"), body: t("benefit1Body"), icon: Award },
    { title: t("benefit2Title"), body: t("benefit2Body"), icon: Heart },
    { title: t("benefit3Title"), body: t("benefit3Body"), icon: GraduationCap },
    { title: t("benefit4Title"), body: t("benefit4Body"), icon: Building2 },
  ];
  const values = [
    { label: t("discipline"), icon: Shield },
    { label: t("strength"), icon: Dumbbell },
    { label: t("respect"), icon: Handshake },
  ];

  return (
    <>
      <section className="relative isolate min-h-[34rem] overflow-hidden bg-bg text-cream sm:min-h-[38rem] lg:min-h-[42rem]">
        <Image
          src="/images/kick-graduation.jpg"
          alt="THE KICK students and instructors at a club graduation"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_42%] sm:object-[center_38%] lg:object-center"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/30 to-bg/75"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-bg/85 via-bg/35 to-transparent sm:from-bg/80 lg:from-bg/90 lg:via-bg/40 lg:to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(200,16,46,0.28),_transparent_45%)]"
        />
        <div className="relative mx-auto grid w-full min-w-0 max-w-6xl grid-cols-1 gap-10 px-4 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
          <div className="w-full min-w-0 [overflow-wrap:anywhere]">
            <h1 className="text-[2.75rem] leading-none sm:text-5xl md:text-7xl">{CLUB.shortName}</h1>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold sm:text-xs sm:tracking-[0.28em] md:tracking-[0.35em]">
              {CLUB.federation}
            </p>
            <p className="mt-4 w-full max-w-xl whitespace-normal text-base leading-snug text-cream/80 sm:text-lg">
              JJU {CLUB.shortName}
              <br className="sm:hidden" />
              {" "}
              {CLUB.fullName.replace(`JJU ${CLUB.shortName} `, "")}
            </p>
            <p className="mt-6 w-full max-w-full whitespace-normal text-sm leading-relaxed text-cream/70 [overflow-wrap:anywhere] sm:max-w-xl sm:text-base">
              {about}
            </p>
            <p className="mt-3 w-full max-w-full whitespace-normal text-sm text-cream/80 [overflow-wrap:anywhere] sm:max-w-xl sm:text-base">
              {t("heroTag")}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <div className="flex w-full flex-wrap items-stretch justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 min-h-12 min-w-0 flex-1 justify-center px-3 sm:flex-none sm:px-5 md:px-6"
                >
                  <Link href="/register">
                    <Icon icon={UserPlus} />
                    <span className="truncate">{t("joinKick")}</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="gold"
                  className="h-12 min-h-12 min-w-0 flex-1 justify-center px-3 sm:flex-none sm:px-5 md:px-6"
                >
                  <Link href="/login">
                    <Icon icon={LogIn} />
                    <span className="truncate">{t("studentLogin")}</span>
                  </Link>
                </Button>
              </div>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 min-h-12 justify-center border-white/20 px-5 text-cream hover:bg-white/10 md:px-6"
              >
                <Link href="/about">
                  <Icon icon={Info} />
                  <span className="truncate">{t("learnMore")}</span>
                </Link>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-bg/35 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-8">
            <p className="inline-flex items-center gap-2 font-display text-2xl text-gold">
              <Icon icon={CalendarClock} size="md" />
              {t("trainingInfo")}
            </p>
            <p className="mt-4 whitespace-pre-line text-cream/80">{settings?.location}</p>
            <TrainingScheduleTable />
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {values.map((item) => (
                <div key={item.label} className="rounded-lg bg-black/20 py-4">
                  <Icon icon={item.icon} className="mx-auto text-gold" />
                  <p className="mt-2 font-display text-sm">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl">{t("whyTrain")}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((item) => (
            <Card key={item.title}>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gold/15 text-gold">
                <Icon icon={item.icon} />
              </span>
              <p className="mt-3 font-display text-lg">{item.title}</p>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-4">
            <SectionTitle icon={Megaphone} className="text-3xl">{t("news")}</SectionTitle>
            <Link href="/news" className="text-sm font-semibold text-red">
              {t("news")}
            </Link>
          </div>
          {announcements.length === 0 ? (
            <p className="mt-8 text-muted">{t("noNews")}</p>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {announcements.map((item) => (
                <Card key={item.id}>
                  <p className="text-xs uppercase tracking-widest text-gold">{formatDate(item.createdAt)}</p>
                  <p className="mt-2 font-display text-xl">{item.title}</p>
                  <p className="mt-2 line-clamp-4 text-sm text-muted">{item.content}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

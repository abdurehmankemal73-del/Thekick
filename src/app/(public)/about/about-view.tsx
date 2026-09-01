"use client";

import { CLUB, DEFAULT_CLUB_SETTINGS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Icon, SectionTitle } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";
import { Activity, Award, BookOpen, Eye, Flag, Target, UserRound } from "lucide-react";

type Instructor = { name: string; title: string; bio: string };

type Settings = {
  about: string | null;
  mission: string | null;
  vision: string | null;
  itfInfo: string | null;
  philosophy: string | null;
  activities: string | null;
  achievements: string | null;
  instructors: Instructor[] | null;
} | null;

export function AboutView({ settings }: { settings: Settings }) {
  const { locale, t } = useI18n();
  const copy = (
    enValue: string | null | undefined,
    key:
      | "aboutBody"
      | "missionBody"
      | "visionBody"
      | "itfBody"
      | "philosophyBody"
      | "activitiesBody"
      | "achievementsBody",
  ) => (locale === "en" ? (enValue ?? t(key)) : t(key));

  const instructors = (
    settings?.instructors?.filter(
      (instructor) => instructor.name && instructor.name !== "Club Instructor",
    ) ?? []
  );
  const instructorList = instructors.length > 0 ? instructors : DEFAULT_CLUB_SETTINGS.instructors;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red">{t("aboutEyebrow")}</p>
      <h1 className="mt-3 text-4xl md:text-5xl">{CLUB.fullName}</h1>
      <p className="mt-4 max-w-3xl text-muted">{copy(settings?.about, "aboutBody")}</p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Card>
          <SectionTitle icon={Target} className="text-xl">{t("mission")}</SectionTitle>
          <p className="mt-3 text-sm leading-7 text-muted">{copy(settings?.mission, "missionBody")}</p>
        </Card>
        <Card>
          <SectionTitle icon={Eye} className="text-xl">{t("vision")}</SectionTitle>
          <p className="mt-3 text-sm leading-7 text-muted">{copy(settings?.vision, "visionBody")}</p>
        </Card>
      </div>

      <Card className="mt-6">
        <SectionTitle icon={Flag} className="text-xl">{t("itfTaekwondo")}</SectionTitle>
        <p className="mt-3 text-sm leading-7 text-muted">{copy(settings?.itfInfo, "itfBody")}</p>
      </Card>
      <Card className="mt-6">
        <SectionTitle icon={BookOpen} className="text-xl">{t("philosophy")}</SectionTitle>
        <p className="mt-3 text-sm leading-7 text-muted">{copy(settings?.philosophy, "philosophyBody")}</p>
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <SectionTitle icon={Activity} className="text-xl">{t("activities")}</SectionTitle>
          <p className="mt-3 text-sm leading-7 text-muted">{copy(settings?.activities, "activitiesBody")}</p>
        </Card>
        <Card>
          <SectionTitle icon={Award} className="text-xl">{t("achievements")}</SectionTitle>
          <p className="mt-3 text-sm leading-7 text-muted">{copy(settings?.achievements, "achievementsBody")}</p>
        </Card>
      </div>

      <SectionTitle icon={UserRound} className="mt-12 text-2xl">{t("instructors")}</SectionTitle>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {instructorList.map((instructor) => (
          <Card key={instructor.name}>
            <p className="font-display text-lg">{instructor.name}</p>
            <p className="text-sm text-gold">{instructor.title}</p>
            {instructor.bio ? (
              <p className="mt-3 text-sm text-muted">{instructor.bio}</p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}

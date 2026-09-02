"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, ClipboardList, GraduationCap, LayoutDashboard, Mail, Megaphone, Send, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { BeltBadge, StatusBadge } from "@/components/ui/badge";
import { EmptyState, Skeleton } from "@/components/ui/empty-state";
import { Icon, PageTitle, SectionTitle } from "@/components/ui/icon";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import type { BeltLevel } from "@/db/schema";

type Dashboard = {
  user: {
    fullName: string;
    email: string;
    telegramUsername: string | null;
    beltLevel: BeltLevel | null;
    accountStatus: string;
  };
  grades: Array<{ id: string; assessmentName: string; overallScore: number | null; result: string | null; assessmentDate: string }>;
  permissions: Array<{ id: string; absenceType: string; status: string; createdAt: string }>;
  announcements: Array<{ id: string; title: string; content: string; createdAt: string }>;
  members: Array<{ fullName: string; beltLevel: BeltLevel | null }>;
};

export default function StudentDashboardPage() {
  const { t, tBelt, tAbsence } = useI18n();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Dashboard>("/api/students/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red">{error}</p>;
  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <PageTitle icon={LayoutDashboard}>
          {t("welcome")}, {data.user.fullName}
        </PageTitle>
        <p className="mt-1 text-muted">{t("studentDash")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
            <Icon icon={Award} className="text-gold" />
            {t("currentBelt")}
          </p>
          <div className="mt-3"><BeltBadge belt={data.user.beltLevel} /></div>
        </Card>
        <Card>
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
            <Icon icon={Mail} className="text-gold" />
            {t("email")}
          </p>
          <p className="mt-2 text-sm">{data.user.email}</p>
        </Card>
        <Card>
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
            <Icon icon={Send} className="text-gold" />
            {t("telegram")}
          </p>
          <p className="mt-2 text-sm">@{data.user.telegramUsername}</p>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle icon={GraduationCap}>{t("recentGrades")}</SectionTitle>
            <Link href="/student/grades" className="text-sm text-red">{t("viewAll")}</Link>
          </div>
          {data.grades.length === 0 ? (
            <EmptyState title={t("noGrades")} icon={GraduationCap} />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.grades.map((g) => (
                <li key={g.id} className="flex justify-between border-b border-line py-2">
                  <span>{g.assessmentName}</span>
                  <span>{g.overallScore ?? g.result ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle icon={ClipboardList}>{t("permissionStatus")}</SectionTitle>
            <Link href="/student/permission" className="text-sm text-red">{t("request")}</Link>
          </div>
          {data.permissions.length === 0 ? (
            <EmptyState title={t("noPermissions")} icon={ClipboardList} />
          ) : (
            <ul className="space-y-2">
              {data.permissions.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span>{tAbsence(p.absenceType)}</span>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle icon={Megaphone}>{t("announcements")}</SectionTitle>
          <Link href="/student/announcements" className="text-sm text-red">{t("viewAll")}</Link>
        </div>
        {data.announcements.length === 0 ? (
          <EmptyState title={t("noNews")} icon={Megaphone} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.announcements.map((a) => (
              <div key={a.id} className="rounded-lg border border-line p-3">
                <p className="text-xs text-gold">{formatDate(a.createdAt)}</p>
                <p className="font-semibold">{a.title}</p>
                <p className="line-clamp-3 text-sm text-muted">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle icon={Users}>
            {t("studentsInBelt")}
            {data.user.beltLevel ? ` — ${tBelt(data.user.beltLevel)}` : ""}
          </SectionTitle>
          <Link href="/student/members" className="text-sm text-red">{t("directory")}</Link>
        </div>
        {data.members.length === 0 ? (
          <EmptyState title={t("noStudents")} icon={Users} />
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {data.members.map((m) => (
              <li key={m.fullName} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
                {m.fullName}
                <BeltBadge belt={m.beltLevel} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

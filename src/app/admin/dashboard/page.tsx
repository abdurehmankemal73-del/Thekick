"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ban, BarChart3, Check, ClipboardList, Clock, GraduationCap, LayoutDashboard, Megaphone, Plus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { Icon, PageTitle, SectionTitle } from "@/components/ui/icon";
import { BeltMark } from "@/components/belt-level";
import { useI18n } from "@/i18n/provider";
import type { BeltLevel } from "@/db/schema";
import type { LucideIcon } from "lucide-react";

type Dash = {
  stats: {
    totalStudents: number;
    pendingRegistrations: number;
    totalPermissions: number;
    pendingPermissions: number;
    totalAnnouncements: number;
  };
  beltDistribution: Array<{ belt: BeltLevel; count: number }>;
  pendingStudents: Array<{ id: string; fullName: string; email: string; accountStatus: string; createdAt: string }>;
  recentRegistrations: Array<{ id: string; fullName: string; accountStatus: string; createdAt: string }>;
  recentPermissions: Array<{ id: string; studentName: string; status: string }>;
  recentGrades: Array<{ id: string; studentName: string; assessmentName: string }>;
  recentAnnouncements: Array<{ id: string; title: string; status: string }>;
};

export default function AdminDashboardPage() {
  const { t, tBelt } = useI18n();
  const [data, setData] = useState<Dash | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    api<Dash>("/api/admin/dashboard").then(setData);
  }

  useEffect(() => {
    load();
  }, []);

  if (!data) return <Skeleton className="h-80" />;

  const cards = [
    { label: t("totalStudents"), value: data.stats.totalStudents, href: "/admin/students", icon: Users },
    { label: t("pendingRegistrations"), value: data.stats.pendingRegistrations, href: "/admin/students?status=PENDING", icon: UserPlus },
    { label: t("totalPermissions"), value: data.stats.totalPermissions, href: "/admin/permissions", icon: ClipboardList },
    { label: t("pendingPermissions"), value: data.stats.pendingPermissions, href: "/admin/permissions?status=PENDING", icon: Clock },
    { label: t("announcements"), value: data.stats.totalAnnouncements, href: "/admin/announcements", icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={LayoutDashboard}>{t("adminDash")}</PageTitle>
          <p className="text-muted">{t("clubOps")}</p>
        </div>
        <div className="flex gap-2">
          <Link className="inline-flex items-center gap-2 rounded-md bg-red px-4 py-2 text-sm font-semibold text-white" href="/admin/students">
            <Icon icon={Users} />
            {t("manageStudents")}
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-semibold" href="/admin/announcements">
            <Icon icon={Plus} />
            {t("newAnnouncement")}
          </Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card>
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
                <Icon icon={card.icon} className="text-gold" />
                {card.label}
              </p>
              <p className="mt-2 font-display text-3xl">{card.value}</p>
            </Card>
          </Link>
        ))}
      </div>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle icon={UserPlus}>{t("pendingRegistrations")}</SectionTitle>
          <Link href="/admin/students?status=PENDING" className="text-sm text-red">{t("viewAll")}</Link>
        </div>
        {data.pendingStudents.length === 0 ? (
          <EmptyState title="No pending registrations." icon={UserPlus} />
        ) : (
          <ul className="space-y-3">
            {data.pendingStudents.map((student) => (
              <li key={student.id} className="flex flex-col gap-2 rounded-lg border border-line p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{student.fullName}</p>
                  <p className="text-sm text-muted">{student.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={busyId === student.id}
                    onClick={async () => {
                      setBusyId(student.id);
                      try {
                        const res = await api<{ message: string; previewUrl?: string }>(`/api/admin/students/${student.id}/approve`, { method: "POST" });
                        toast.success(res.previewUrl ? `${res.message} ${res.previewUrl}` : res.message);
                        load();
                      } catch (error) {
                        toast.error(error instanceof ApiError ? error.message : "Approval email failed. The student was not approved.");
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    <Icon icon={Check} />
                    {busyId === student.id ? "Sending…" : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busyId === student.id}
                    onClick={async () => {
                      if (!confirm("Reject this registration?")) return;
                      setBusyId(student.id);
                      try {
                        await api(`/api/admin/students/${student.id}/reject`, { method: "POST" });
                        toast.success("Rejected");
                        load();
                      } catch (error) {
                        toast.error(error instanceof ApiError ? error.message : "Reject failed");
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    <Icon icon={Ban} />
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <SectionTitle icon={BarChart3}>Belt-level distribution</SectionTitle>
        <ul className="mt-4 divide-y divide-line">
          {data.beltDistribution.map((row) => (
            <li key={row.belt} className="flex items-center gap-3 py-2.5">
              <BeltMark belt={row.belt} size="md" />
              <span className="min-w-0 flex-1 text-sm font-medium">{tBelt(row.belt)}</span>
              <span className="font-display text-lg tabular-nums">{row.count}</span>
            </li>
          ))}
        </ul>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Activity title="Recent registrations" empty="No recent activity." icon={UserPlus}>
          {data.recentRegistrations.map((row) => (
            <li key={row.id} className="flex justify-between text-sm">
              <span>{row.fullName}</span>
              <StatusBadge status={row.accountStatus} />
            </li>
          ))}
        </Activity>
        <Activity title="Recent permissions" empty="No permission requests." icon={ClipboardList}>
          {data.recentPermissions.map((row) => (
            <li key={row.id} className="flex justify-between text-sm">
              <span>{row.studentName}</span>
              <StatusBadge status={row.status} />
            </li>
          ))}
        </Activity>
        <Activity title="Recent grades" empty="No grades available yet." icon={GraduationCap}>
          {data.recentGrades.map((row) => (
            <li key={row.id} className="flex justify-between text-sm">
              <span>{row.studentName}</span>
              <span className="text-muted">{row.assessmentName}</span>
            </li>
          ))}
        </Activity>
        <Activity title="Recent announcements" empty="No announcements available." icon={Megaphone}>
          {data.recentAnnouncements.map((row) => (
            <li key={row.id} className="flex justify-between text-sm">
              <span>{row.title}</span>
              <StatusBadge status={row.status} />
            </li>
          ))}
        </Activity>
      </div>
    </div>
  );
}

function Activity({
  title,
  empty,
  icon,
  children,
}: {
  title: string;
  empty: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  const has = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <Card>
      <SectionTitle icon={icon} className="mb-3">{title}</SectionTitle>
      {has ? <ul className="space-y-2">{children}</ul> : <EmptyState title={empty} icon={icon} />}
    </Card>
  );
}

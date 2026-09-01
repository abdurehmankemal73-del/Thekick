"use client";

import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Home,
  LayoutDashboard,
  Megaphone,
  User,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useI18n } from "@/i18n/provider";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const items = [
    { href: "/student/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/student/profile", label: t("myProfile"), icon: User },
    { href: "/student/grades", label: t("myGrades"), icon: GraduationCap },
    { href: "/student/members", label: t("sameBelt"), icon: Users },
    { href: "/student/permission", label: t("permission"), icon: ClipboardList },
    { href: "/student/announcements", label: t("announcements"), icon: Megaphone },
    { href: "/calendar", label: t("navCalendar"), icon: CalendarDays },
    { href: "/", label: t("navHome"), icon: Home },
  ];
  return <AppShell title={t("student")} items={items}>{children}</AppShell>;
}

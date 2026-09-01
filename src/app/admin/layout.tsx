"use client";

import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Mail,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useI18n } from "@/i18n/provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const items = [
    { href: "/admin/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/admin/students", label: t("students"), icon: Users },
    { href: "/admin/grades", label: t("grades"), icon: GraduationCap },
    { href: "/admin/permissions", label: t("permissions"), icon: ClipboardList },
    { href: "/admin/calendar", label: t("navCalendar"), icon: CalendarDays },
    { href: "/admin/announcements", label: t("announcements"), icon: Megaphone },
    { href: "/admin/messages", label: t("messages"), icon: Mail },
    { href: "/admin/settings", label: t("settings"), icon: Settings },
  ];
  return <AppShell title={t("admin")} items={items}>{children}</AppShell>;
}

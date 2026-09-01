"use client";

import { useEffect, useState } from "react";
import { Mail, Send, User } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { BeltBadge, StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/empty-state";
import { Icon, PageTitle } from "@/components/ui/icon";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import type { BeltLevel } from "@/db/schema";

type User = {
  fullName: string;
  email: string;
  telegramUsername: string | null;
  beltLevel: BeltLevel | null;
  accountStatus: string;
  createdAt: string;
};

export default function ProfilePage() {
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api<{ user: User }>("/api/students/me").then((res) => setUser(res.user));
  }, []);

  if (!user) return <Skeleton className="h-64" />;

  const rows = [
    [t("fullName"), user.fullName],
    [t("email"), user.email],
    [t("telegramUsername"), user.telegramUsername ? `@${user.telegramUsername}` : "—"],
    [t("accountStatus"), user.accountStatus],
    [t("registrationDate"), formatDate(user.createdAt)],
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <PageTitle icon={User}>{t("myProfile")}</PageTitle>
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">{t("currentBelt")}</p>
          <BeltBadge belt={user.beltLevel} />
        </div>
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-t border-line pt-3 text-sm">
            <span className="inline-flex items-center gap-2 text-muted">
              {label === t("email") ? <Icon icon={Mail} className="text-gold" /> : null}
              {label === t("telegramUsername") ? <Icon icon={Send} className="text-gold" /> : null}
              {label}
            </span>
            {label === t("accountStatus") ? <StatusBadge status={String(value)} /> : <span>{value}</span>}
          </div>
        ))}
      </Card>
      <p className="text-sm text-muted">
        Belt level, role, and grades can only be changed by an administrator.
      </p>
    </div>
  );
}

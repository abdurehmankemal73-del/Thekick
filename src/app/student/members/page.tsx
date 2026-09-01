"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { api } from "@/lib/api";
import { SearchField } from "@/components/ui/fields";
import { BeltBadge } from "@/components/ui/badge";
import { BeltMark } from "@/components/belt-level";
import { EmptyState, Skeleton } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";
import type { BeltLevel } from "@/db/schema";

type Member = { fullName: string; beltLevel: BeltLevel | null };

export default function MembersPage() {
  const { t, tBelt } = useI18n();
  const [q, setQ] = useState("");
  const [belt, setBelt] = useState<BeltLevel | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const query = q ? `?q=${encodeURIComponent(q)}` : "";
      api<{ beltLevel: BeltLevel; members: Member[] }>(`/api/students/same-belt${query}`).then(
        (res) => {
          setBelt(res.beltLevel);
          setMembers(res.members);
        },
      );
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-4">
      <div>
        <PageTitle icon={Users}>{t("studentsInBelt")}</PageTitle>
        <p className="mt-2 flex items-center gap-2 text-muted">
          {belt ? (
            <>
              <BeltMark belt={belt} size="sm" />
              <span>{tBelt(belt)}</span>
            </>
          ) : (
            t("studentsInBeltHint")
          )}
        </p>
      </div>
      <SearchField
        placeholder={t("searchByName")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label={t("searchByName")}
      />
      {!members ? (
        <Skeleton className="h-48" />
      ) : members.length === 0 ? (
        <EmptyState title={t("noStudents")} icon={Users} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {members.map((m) => (
            <Card key={m.fullName} className="flex items-center justify-between">
              <p className="font-medium">{m.fullName}</p>
              <BeltBadge belt={m.beltLevel} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

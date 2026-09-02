"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/icon";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

type Grade = {
  id: string;
  assessmentName: string;
  patternScore: number | null;
  sparringScore: number | null;
  kicksScore: number | null;
  theoryScore: number | null;
  disciplineScore: number | null;
  overallScore: number | null;
  result: string | null;
  instructorComment: string | null;
  assessmentDate: string;
};

export default function StudentGradesPage() {
  const { t } = useI18n();
  const [grades, setGrades] = useState<Grade[] | null>(null);

  useEffect(() => {
    api<{ grades: Grade[] }>("/api/students/me/grades").then((res) => setGrades(res.grades));
  }, []);

  if (!grades) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <PageTitle icon={GraduationCap}>{t("myGrades")}</PageTitle>
      {grades.length === 0 ? (
        <EmptyState title={t("noGrades")} description={t("noGradesHint")} icon={GraduationCap} />
      ) : (
        <div className="grid gap-4">
          {grades.map((grade) => (
            <Card key={grade.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl">{grade.assessmentName}</h2>
                  <p className="text-sm text-muted">{formatDate(grade.assessmentDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">{t("overall")}</p>
                  <p className="font-display text-2xl text-red">{grade.overallScore ?? "—"}</p>
                  {grade.result ? <p className="text-sm text-muted">{grade.result}</p> : null}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
                <Score label={t("pattern")} value={grade.patternScore} />
                <Score label={t("sparring")} value={grade.sparringScore} />
                <Score label={t("kicks")} value={grade.kicksScore} />
                <Score label={t("theory")} value={grade.theoryScore} />
                <Score label={t("discipline")} value={grade.disciplineScore} />
              </div>
              {grade.instructorComment ? (
                <p className="mt-4 text-sm text-muted">{grade.instructorComment}</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Score({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md bg-surface p-2">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold">{value ?? "—"}</p>
    </div>
  );
}

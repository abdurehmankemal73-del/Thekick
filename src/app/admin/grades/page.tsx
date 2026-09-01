"use client";

import { FormEvent, useEffect, useState } from "react";
import { GraduationCap, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, SearchField, Select, Textarea } from "@/components/ui/fields";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, PageTitle } from "@/components/ui/icon";
import { BELT_LEVELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { BeltLevel } from "@/db/schema";
import { useI18n } from "@/i18n/provider";

type Student = { id: string; fullName: string; beltLevel: BeltLevel | null };
type Grade = {
  id: string;
  studentId: string;
  studentName: string;
  assessmentName: string;
  overallScore: number | null;
  result: string | null;
  assessmentDate: string;
};

export default function AdminGradesPage() {
  const { t, tBelt } = useI18n();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [q, setQ] = useState("");
  const [belt, setBelt] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (belt) params.set("belt", belt);
    api<{ grades: Grade[] }>(`/api/admin/grades?${params}`).then((res) => setGrades(res.grades));
    api<{ students: Student[] }>("/api/admin/students?pageSize=50&status=ACTIVE").then((res) =>
      setStudents(res.students),
    );
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [q, belt]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/admin/grades", {
        method: "POST",
        body: JSON.stringify({
          studentId: form.get("studentId"),
          assessmentName: form.get("assessmentName"),
          patternScore: form.get("patternScore") || null,
          sparringScore: form.get("sparringScore") || null,
          kicksScore: form.get("kicksScore") || null,
          theoryScore: form.get("theoryScore") || null,
          disciplineScore: form.get("disciplineScore") || null,
          overallScore: form.get("overallScore") || null,
          result: form.get("result"),
          instructorComment: form.get("instructorComment"),
          assessmentDate: form.get("assessmentDate"),
        }),
      });
      toast.success("Grade added");
      event.currentTarget.reset();
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save grade");
    }
  }

  async function remove(id: string) {
    await api(`/api/admin/grades/${id}`, { method: "DELETE" });
    toast.success("Grade deleted");
    setConfirmId(null);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <PageTitle icon={GraduationCap}>{t("grades")}</PageTitle>
        <Card className="mt-4">
          <form onSubmit={onSubmit} className="grid gap-3">
            <div>
              <Label htmlFor="studentId">Student</Label>
              <Select id="studentId" name="studentId" required defaultValue="">
                <option value="" disabled>Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} {s.beltLevel ? `(${tBelt(s.beltLevel)})` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="assessmentName">Assessment name</Label>
              <Input id="assessmentName" name="assessmentName" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["patternScore", "sparringScore", "kicksScore", "theoryScore", "disciplineScore", "overallScore"].map((name) => (
                <div key={name}>
                  <Label htmlFor={name}>{name.replace("Score", " score")}</Label>
                  <Input id={name} name={name} type="number" min={0} max={100} />
                </div>
              ))}
            </div>
            <div>
              <Label htmlFor="result">Grade/result</Label>
              <Input id="result" name="result" placeholder="Pass / Fail / A" />
            </div>
            <div>
              <Label htmlFor="assessmentDate">Assessment date</Label>
              <Input id="assessmentDate" name="assessmentDate" type="date" required />
            </div>
            <div>
              <Label htmlFor="instructorComment">Instructor comment</Label>
              <Textarea id="instructorComment" name="instructorComment" />
            </div>
            <Button type="submit">
              <Icon icon={Plus} />
              Add grade
            </Button>
          </form>
        </Card>
      </div>
      <div>
        <div className="mb-3 grid gap-2 md:grid-cols-2">
          <SearchField placeholder="Search student" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={belt} onChange={(e) => setBelt(e.target.value)}>
            <option value="">All belts</option>
            {BELT_LEVELS.map((b) => (
              <option key={b} value={b}>{tBelt(b)}</option>
            ))}
          </Select>
        </div>
        {grades.length === 0 ? (
          <EmptyState title="No grades available yet." icon={GraduationCap} />
        ) : (
          <div className="space-y-3">
            {grades.map((g) => (
              <Card key={g.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{g.studentName}</p>
                    <p className="text-sm text-muted">{g.assessmentName} · {formatDate(g.assessmentDate)}</p>
                  </div>
                  <p className="font-display text-xl text-red">{g.result ?? g.overallScore ?? "—"}</p>
                </div>
                <Button size="sm" variant="danger" className="mt-3" onClick={() => setConfirmId(g.id)}>
                  <Icon icon={Trash2} />
                  Delete
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
      {confirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/60 p-4">
          <Card className="max-w-md">
            <h2 className="text-xl">Delete this grade?</h2>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setConfirmId(null)}>
                <Icon icon={X} />
                Cancel
              </Button>
              <Button variant="danger" onClick={() => remove(confirmId)}>
                <Icon icon={Trash2} />
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { GraduationCap, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, SearchField, Select, Textarea } from "@/components/ui/fields";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, PageTitle } from "@/components/ui/icon";
import { BELT_LEVELS } from "@/lib/constants";
import { calculateOverallScore, GRADE_SCORE_KEYS, type GradeScoreKey } from "@/lib/grades";
import { dateInputValue, formatDate } from "@/lib/utils";
import type { BeltLevel } from "@/db/schema";
import { useI18n } from "@/i18n/provider";

const SCORE_LABELS: Record<GradeScoreKey, "pattern" | "sparring" | "kicks" | "theory" | "discipline"> = {
  patternScore: "pattern",
  sparringScore: "sparring",
  kicksScore: "kicks",
  theoryScore: "theory",
  disciplineScore: "discipline",
};

type Student = { id: string; fullName: string; beltLevel: BeltLevel | null };
type Grade = {
  id: string;
  studentId: string;
  studentName: string;
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

type ScoreDraft = Record<GradeScoreKey, string>;

function emptyScores(): ScoreDraft {
  return {
    patternScore: "",
    sparringScore: "",
    kicksScore: "",
    theoryScore: "",
    disciplineScore: "",
  };
}

function scoresFromGrade(grade: Grade | null): ScoreDraft {
  if (!grade) return emptyScores();
  return {
    patternScore: grade.patternScore?.toString() ?? "",
    sparringScore: grade.sparringScore?.toString() ?? "",
    kicksScore: grade.kicksScore?.toString() ?? "",
    theoryScore: grade.theoryScore?.toString() ?? "",
    disciplineScore: grade.disciplineScore?.toString() ?? "",
  };
}

function parseScore(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function numericScores(draft: ScoreDraft) {
  return Object.fromEntries(GRADE_SCORE_KEYS.map((key) => [key, parseScore(draft[key])])) as Record<
    GradeScoreKey,
    number | null
  >;
}

export default function AdminGradesPage() {
  const { t, tBelt } = useI18n();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [q, setQ] = useState("");
  const [belt, setBelt] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Grade | null>(null);
  const [scores, setScores] = useState<ScoreDraft>(emptyScores);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const overallPreview = useMemo(() => calculateOverallScore(numericScores(scores)), [scores]);

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
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [q, belt]);

  useEffect(() => {
    if (!editing) return;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editing, formKey]);

  function startEdit(grade: Grade) {
    setEditing(grade);
    setScores(scoresFromGrade(grade));
    setFormKey((key) => key + 1);
  }

  function cancelEdit() {
    setEditing(null);
    setScores(emptyScores());
    setFormKey((key) => key + 1);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      studentId: form.get("studentId"),
      assessmentName: form.get("assessmentName"),
      ...numericScores(scores),
      result: form.get("result") || null,
      instructorComment: form.get("instructorComment") || null,
      assessmentDate: form.get("assessmentDate"),
    };
    try {
      if (editing) {
        await api(`/api/admin/grades/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Grade updated");
        cancelEdit();
      } else {
        await api("/api/admin/grades", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Grade added");
        event.currentTarget.reset();
        setScores(emptyScores());
      }
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save grade");
    }
  }

  async function remove(id: string) {
    await api(`/api/admin/grades/${id}`, { method: "DELETE" });
    toast.success("Grade deleted");
    if (editing?.id === id) cancelEdit();
    setConfirmId(null);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <PageTitle icon={GraduationCap}>{t("grades")}</PageTitle>
        <Card className="mt-4">
          <form ref={formRef} key={formKey} onSubmit={onSubmit} className="grid gap-3">
            <h2 className="text-lg font-semibold">{editing ? "Edit grade" : "Add grade"}</h2>
            <div>
              <Label htmlFor="studentId">Student</Label>
              <Select id="studentId" name="studentId" required defaultValue={editing?.studentId ?? ""}>
                <option value="" disabled>
                  Select student
                </option>
                {(editing && !students.some((s) => s.id === editing.studentId)
                  ? [{ id: editing.studentId, fullName: editing.studentName, beltLevel: null as BeltLevel | null }, ...students]
                  : students
                ).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} {s.beltLevel ? `(${tBelt(s.beltLevel)})` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="assessmentName">Assessment name</Label>
              <Input
                id="assessmentName"
                name="assessmentName"
                required
                defaultValue={editing?.assessmentName ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GRADE_SCORE_KEYS.map((name) => (
                <div key={name}>
                  <Label htmlFor={name}>{t(SCORE_LABELS[name])}</Label>
                  <Input
                    id={name}
                    name={name}
                    type="number"
                    min={0}
                    max={100}
                    value={scores[name]}
                    onChange={(event) =>
                      setScores((current) => ({ ...current, [name]: event.target.value }))
                    }
                  />
                </div>
              ))}
              <div>
                <Label htmlFor="overallScore">{t("overall")}</Label>
                <Input
                  id="overallScore"
                  readOnly
                  tabIndex={-1}
                  value={overallPreview ?? ""}
                  placeholder="—"
                  className="font-display text-xl text-red"
                />
                <p className="mt-1 text-xs text-muted">
                  {overallPreview == null
                    ? "Fills in automatically after all five scores are entered"
                    : "Average of the five scores"}
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="result">Grade/result</Label>
              <Input
                id="result"
                name="result"
                placeholder="Pass / Fail / A"
                defaultValue={editing?.result ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="assessmentDate">Assessment date</Label>
              <Input
                id="assessmentDate"
                name="assessmentDate"
                type="date"
                required
                defaultValue={editing ? dateInputValue(editing.assessmentDate) : ""}
              />
            </div>
            <div>
              <Label htmlFor="instructorComment">Instructor comment</Label>
              <Textarea
                id="instructorComment"
                name="instructorComment"
                defaultValue={editing?.instructorComment ?? ""}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                <Icon icon={editing ? Save : Plus} />
                {editing ? "Save grade" : "Add grade"}
              </Button>
              {editing ? (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  <Icon icon={X} />
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      </div>
      <div>
        <div className="mb-3 grid gap-2 md:grid-cols-2">
          <SearchField placeholder="Search student" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={belt} onChange={(e) => setBelt(e.target.value)}>
            <option value="">All belts</option>
            {BELT_LEVELS.map((b) => (
              <option key={b} value={b}>
                {tBelt(b)}
              </option>
            ))}
          </Select>
        </div>
        {grades.length === 0 ? (
          <EmptyState title="No grades available yet." icon={GraduationCap} />
        ) : (
          <div className="space-y-3">
            {grades.map((g) => (
              <Card key={g.id} className={editing?.id === g.id ? "ring-2 ring-red" : undefined}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{g.studentName}</p>
                    <p className="text-sm text-muted">
                      {g.assessmentName} · {formatDate(g.assessmentDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl text-red">{g.overallScore ?? "—"}</p>
                    {g.result ? <p className="text-xs text-muted">{g.result}</p> : null}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-5 gap-1 text-center text-xs text-muted">
                  {GRADE_SCORE_KEYS.map((key) => (
                    <div key={key}>
                      <p>{t(SCORE_LABELS[key])}</p>
                      <p className="font-semibold text-ink">{g[key] ?? "—"}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(g)}>
                    <Icon icon={Pencil} />
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirmId(g.id)}>
                    <Icon icon={Trash2} />
                    Delete
                  </Button>
                </div>
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

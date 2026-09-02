"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Ban, Check, Pencil, Save, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, SearchField, Select } from "@/components/ui/fields";
import { BeltBadge, StatusBadge } from "@/components/ui/badge";
import { EmptyState, Skeleton } from "@/components/ui/empty-state";
import { Icon, PageTitle } from "@/components/ui/icon";
import { BeltLevelList } from "@/components/belt-level";
import { ACCOUNT_STATUSES, BELT_LEVELS } from "@/lib/constants";
import type { AccountStatus, BeltLevel } from "@/db/schema";
import { useI18n } from "@/i18n/provider";

type Student = {
  id: string;
  fullName: string;
  email: string;
  telegramUsername: string | null;
  beltLevel: BeltLevel | null;
  accountStatus: AccountStatus;
};

export default function AdminStudentsPage() {
  return (
    <Suspense>
      <AdminStudentsInner />
    </Suspense>
  );
}

function AdminStudentsInner() {
  const { t, tBelt } = useI18n();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [belt, setBelt] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [students, setStudents] = useState<Student[] | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (belt) params.set("belt", belt);
    if (status) params.set("status", status);
    return params.toString();
  }, [q, belt, status]);

  function load() {
    api<{ students: Student[] }>(`/api/admin/students${query ? `?${query}` : ""}`).then((res) =>
      setStudents(res.students),
    );
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [query]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    try {
      await api(`/api/admin/students/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: form.get("fullName"),
          telegramUsername: form.get("telegramUsername"),
          beltLevel: form.get("beltLevel"),
          accountStatus: form.get("accountStatus"),
        }),
      });
      toast.success("Student updated");
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Update failed");
    }
  }

  async function approve(id: string) {
    setBusyId(id);
    try {
      const res = await api<{ message: string; previewUrl?: string; emailSent?: boolean }>(
        `/api/admin/students/${id}/approve`,
        { method: "POST" },
      );
      if (res.emailSent === false) {
        toast.success("Student approved.");
        toast.warning(res.message);
      } else {
        toast.success(res.previewUrl ? `${res.message} ${res.previewUrl}` : res.message);
      }
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Approval failed. The student was not marked approved.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    try {
      await api(`/api/admin/students/${id}/reject`, { method: "POST" });
      toast.success("Registration rejected");
      setRejectId(null);
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/admin/students/${id}`, { method: "DELETE" });
      toast.success("Student removed");
      setConfirmId(null);
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      <PageTitle icon={Users}>{t("students")}</PageTitle>
      <div className="grid gap-3 md:grid-cols-3">
        <SearchField placeholder="Search name, email, Telegram" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={belt} onChange={(e) => setBelt(e.target.value)}>
          <option value="">All belts</option>
          {BELT_LEVELS.map((b) => (
            <option key={b} value={b}>{tBelt(b)}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {ACCOUNT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>
      {!students ? (
        <Skeleton className="h-64" />
      ) : students.length === 0 ? (
        <EmptyState title="No students found." icon={Users} />
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <Card key={student.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{student.fullName}</p>
                <p className="text-sm text-muted">{student.email} · @{student.telegramUsername}</p>
                <div className="mt-2 flex gap-2">
                  <BeltBadge belt={student.beltLevel} />
                  <StatusBadge status={student.accountStatus} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {student.accountStatus === "PENDING" ? (
                  <>
                    <Button size="sm" disabled={busyId === student.id} onClick={() => approve(student.id)}>
                      <Icon icon={Check} />
                      {busyId === student.id ? "Sending…" : "Approve"}
                    </Button>
                    <Button size="sm" variant="danger" disabled={busyId === student.id} onClick={() => setRejectId(student.id)}>
                      <Icon icon={Ban} />
                      Reject
                    </Button>
                  </>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => setEditing(student)}>
                  <Icon icon={Pencil} />
                  Edit / promote
                </Button>
                <Button size="sm" variant="danger" onClick={() => setConfirmId(student.id)}>
                  <Icon icon={Trash2} />
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/60 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl">Edit student</h2>
            <form onSubmit={save} className="mt-4 space-y-3">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" defaultValue={editing.fullName} />
              </div>
              <div>
                <Label htmlFor="telegramUsername">Telegram Username</Label>
                <Input id="telegramUsername" name="telegramUsername" defaultValue={editing.telegramUsername ?? ""} />
              </div>
              <div>
                <Label id="edit-beltLevel-label">Belt</Label>
                <BeltLevelList
                  key={editing.id}
                  name="beltLevel"
                  defaultValue={editing.beltLevel ?? "WHITE"}
                  labelledBy="edit-beltLevel-label"
                  className="mt-1.5 max-h-64 overflow-y-auto pr-1"
                />
              </div>
              <div>
                <Label htmlFor="accountStatus">Account status</Label>
                <Select id="accountStatus" name="accountStatus" defaultValue={editing.accountStatus}>
                  {ACCOUNT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <Icon icon={Save} />
                  Save
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  <Icon icon={X} />
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {rejectId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/60 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl">Reject this registration?</h2>
            <p className="mt-2 text-sm text-muted">The student will not be able to sign in.</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setRejectId(null)}>
                <Icon icon={X} />
                Cancel
              </Button>
              <Button variant="danger" onClick={() => reject(rejectId)}>
                <Icon icon={Ban} />
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {confirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/60 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl">Are you sure you want to remove this student?</h2>
            <p className="mt-2 text-sm text-muted">This cannot be undone.</p>
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

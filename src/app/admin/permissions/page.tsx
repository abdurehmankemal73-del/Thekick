"use client";

import { useEffect, useState } from "react";
import { Ban, Check, ClipboardList, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchField, Select } from "@/components/ui/fields";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, PageTitle } from "@/components/ui/icon";
import { ABSENCE_LABELS, ABSENCE_TYPES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

type Item = {
  id: string;
  studentName: string;
  absenceType: keyof typeof ABSENCE_LABELS;
  reason: string;
  status: string;
  createdAt: string;
};

export default function AdminPermissionsPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState("");
  const [absenceType, setAbsenceType] = useState("");
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<{ id: string; action: "reject" | "delete" } | null>(null);

  function load() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (absenceType) params.set("absenceType", absenceType);
    if (q) params.set("q", q);
    api<{ permissions: Item[] }>(`/api/admin/permissions?${params}`).then((res) => setItems(res.permissions));
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [status, absenceType, q]);

  async function decide(id: string, next: "APPROVED" | "REJECTED") {
    await api(`/api/admin/permissions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    toast.success(next === "APPROVED" ? "Approved" : "Rejected");
    setConfirm(null);
    load();
  }

  async function remove(id: string) {
    await api(`/api/admin/permissions/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    setConfirm(null);
    load();
  }

  return (
    <div className="space-y-4">
      <PageTitle icon={ClipboardList}>{t("permissions")}</PageTitle>
      <div className="grid gap-3 md:grid-cols-3">
        <SearchField placeholder="Search student or reason" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
        <Select value={absenceType} onChange={(e) => setAbsenceType(e.target.value)}>
          <option value="">All types</option>
          {ABSENCE_TYPES.map((t) => (
            <option key={t} value={t}>{ABSENCE_LABELS[t]}</option>
          ))}
        </Select>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No permission requests." icon={ClipboardList} />
      ) : (
        items.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.studentName}</p>
                <p className="text-sm text-muted">{ABSENCE_LABELS[item.absenceType]} · {formatDateTime(item.createdAt)}</p>
                <p className="mt-2 text-sm">{item.reason}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            {item.status === "PENDING" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => decide(item.id, "APPROVED")}>
                  <Icon icon={Check} />
                  Approve
                </Button>
                <Button size="sm" variant="danger" onClick={() => setConfirm({ id: item.id, action: "reject" })}>
                  <Icon icon={Ban} />
                  Reject
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setConfirm({ id: item.id, action: "delete" })}>
                <Icon icon={Trash2} />
                Delete
              </Button>
            )}
          </Card>
        ))
      )}
      {confirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/60 p-4">
          <Card className="max-w-md">
            <h2 className="text-xl">
              {confirm.action === "reject" ? "Reject this permission request?" : "Delete this request?"}
            </h2>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setConfirm(null)}>
                <Icon icon={X} />
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => (confirm.action === "reject" ? decide(confirm.id, "REJECTED") : remove(confirm.id))}
              >
                <Icon icon={confirm.action === "reject" ? Ban : Trash2} />
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

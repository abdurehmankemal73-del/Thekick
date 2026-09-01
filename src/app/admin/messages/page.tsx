"use client";

import { useEffect, useState } from "react";
import { CheckCheck, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, PageTitle } from "@/components/ui/icon";
import { formatDateTime } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

type Message = {
  id: string;
  fullName: string;
  email: string;
  message: string;
  status: "NEW" | "READ";
  createdAt: string;
};

export default function AdminMessagesPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Message[]>([]);

  function load() {
    api<{ messages: Message[] }>("/api/admin/messages").then((res) => setItems(res.messages));
  }

  useEffect(() => {
    load();
  }, []);

  async function mark(id: string) {
    await api(`/api/admin/messages/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "READ" }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this message?")) return;
    await api(`/api/admin/messages/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    load();
  }

  return (
    <div className="space-y-4">
      <PageTitle icon={Mail}>{t("messages")}</PageTitle>
      {items.length === 0 ? (
        <EmptyState title="No recent activity." description="Contact form messages will appear here." icon={Mail} />
      ) : (
        items.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{item.fullName}</p>
                <p className="text-sm text-muted">
                  {item.email} · {formatDateTime(item.createdAt)}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-3 text-sm">{item.message}</p>
            <div className="mt-3 flex gap-2">
              {item.status === "NEW" ? (
                <Button size="sm" variant="outline" onClick={() => mark(item.id)}>
                  <Icon icon={CheckCheck} />
                  Mark read
                </Button>
              ) : null}
              <Button size="sm" variant="danger" onClick={() => remove(item.id)}>
                <Icon icon={Trash2} />
                Delete
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

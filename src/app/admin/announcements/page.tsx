"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Megaphone, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/fields";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, PageTitle } from "@/components/ui/icon";
import { ImageUploader } from "@/components/image-uploader";
import { NewsImage } from "@/components/news-image";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

type Item = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  createdAt: string;
  authorName: string;
  extraImages: Array<{ id: string; url: string }>;
};

export default function AdminAnnouncementsPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cover, setCover] = useState<string[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const savingRef = useRef(false);
  const [formKey, setFormKey] = useState(0);

  function load() {
    api<{ announcements: Item[] }>("/api/admin/announcements")
      .then((res) => setItems(res.announcements))
      .catch((error) => {
        toast.error(error instanceof ApiError ? error.message : "Could not load news");
      });
  }

  useEffect(() => {
    load();
  }, []);

  function fill(item: Item | null) {
    setEditing(item);
    setCover(item?.imageUrl ? [item.imageUrl] : []);
    setGallery(item?.extraImages.map((image) => image.url) ?? []);
    setErrors({});
  }

  function resetComposer() {
    setEditing(null);
    setCover([]);
    setGallery([]);
    setErrors({});
    setFormKey((key) => key + 1);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    const data = new FormData(event.currentTarget);
    const payload = {
      title: String(data.get("title") ?? "").trim(),
      content: String(data.get("content") ?? "").trim(),
      imageUrl: cover[0] ?? null,
      extraImageUrls: gallery,
      status: String(data.get("status") ?? "PUBLISHED"),
      publishedAt: String(data.get("publishedAt") ?? "").trim() || null,
    };
    setErrors({});
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/admin/announcements/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("News updated");
      } else {
        await api("/api/admin/announcements", { method: "POST", body: JSON.stringify(payload) });
        toast.success("News created");
      }
    } catch (error) {
      const details =
        error instanceof ApiError && error.details && typeof error.details === "object"
          ? (error.details as Record<string, string>)
          : undefined;
      if (details) setErrors(details);
      toast.error(error instanceof ApiError ? error.message : "Save failed");
      savingRef.current = false;
      setSaving(false);
      return;
    }

    resetComposer();
    savingRef.current = false;
    setSaving(false);
    load();
  }

  async function togglePublish(item: Item) {
    const next = item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await api(`/api/admin/announcements/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      toast.success(next === "PUBLISHED" ? "Published" : "Unpublished");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Update failed");
    }
  }

  async function remove(id: string) {
    await api(`/api/admin/announcements/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    setConfirmId(null);
    if (editing?.id === id) fill(null);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <PageTitle icon={Megaphone}>{t("announcements")}</PageTitle>
        <Card className="mt-4">
          <form key={`${editing?.id ?? "new"}-${formKey}`} onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required defaultValue={editing?.title} />
              <FieldError message={errors.title} />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" name="content" required defaultValue={editing?.content} />
              <FieldError message={errors.content} />
            </div>
            <ImageUploader label="Cover image" value={cover} onChange={setCover} />
            <FieldError message={errors.imageUrl} />
            <ImageUploader label="Additional images" value={gallery} onChange={setGallery} multiple />
            <div>
              <Label htmlFor="publishedAt">Publication date</Label>
              <Input
                id="publishedAt"
                name="publishedAt"
                type="date"
                defaultValue={editing?.publishedAt ? editing.publishedAt.slice(0, 10) : ""}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={editing?.status ?? "PUBLISHED"}>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </Select>
            </div>
            {editing ? <p className="text-xs text-muted">Author: {editing.authorName}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                <Icon icon={editing ? Save : Plus} />
                {saving ? "Saving…" : editing ? "Save changes" : "Create"}
              </Button>
              {editing ? (
                <Button type="button" variant="outline" onClick={() => resetComposer()}>
                  <Icon icon={X} />
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <EmptyState title="No announcements available." icon={Megaphone} />
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-muted">
                    {formatDate(item.publishedAt ?? item.createdAt)} · {item.authorName}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              {item.imageUrl ? (
                <NewsImage
                  src={item.imageUrl}
                  alt=""
                  className="mt-3 h-32 w-full rounded-md object-cover"
                  fallbackClassName="mt-3 h-32 w-full rounded-md"
                />
              ) : null}
              <p className="mt-2 line-clamp-3 text-sm text-muted">{item.content}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => fill(item)}>
                  <Icon icon={Pencil} />
                  Edit
                </Button>
                <Button size="sm" variant="gold" onClick={() => togglePublish(item)}>
                  {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </Button>
                <Button size="sm" variant="danger" onClick={() => setConfirmId(item.id)}>
                  <Icon icon={Trash2} />
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
      {confirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/60 p-4">
          <Card className="max-w-md">
            <h2 className="text-xl">Delete this announcement?</h2>
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

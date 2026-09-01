"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/icon";
import { NewsImage } from "@/components/news-image";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

type Announcement = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
};

export default function StudentAnnouncementsPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ announcements: Announcement[] }>("/api/announcements?limit=20")
      .then((res) => setItems(res.announcements))
      .catch((err) => setError(err instanceof ApiError ? err.message : t("noNews")));
  }, [t]);

  if (error) return <EmptyState title={error} icon={Megaphone} />;
  if (!items) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <PageTitle icon={Megaphone}>{t("announcements")}</PageTitle>
      {items.length === 0 ? (
        <EmptyState title={t("noNews")} icon={Megaphone} />
      ) : (
        items.map((item) => (
          <Card key={item.id}>
            <p className="text-xs uppercase tracking-widest text-gold">{formatDate(item.createdAt)}</p>
            {item.imageUrl ? (
              <NewsImage
                src={item.imageUrl}
                alt=""
                className="mt-3 max-h-64 w-full rounded-lg object-cover"
                fallbackClassName="mt-3 h-40 w-full rounded-lg"
              />
            ) : null}
            <h2 className="mt-1 text-2xl">{item.title}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{item.content}</p>
          </Card>
        ))
      )}
    </div>
  );
}

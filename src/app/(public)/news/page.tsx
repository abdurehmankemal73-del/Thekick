"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/icon";
import { NewsImage } from "@/components/news-image";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

type NewsItem = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  authorName: string;
};

export default function NewsPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ announcements: NewsItem[] }>("/api/announcements?limit=20")
      .then((res) => setItems(res.announcements))
      .catch((err) => setError(err instanceof ApiError ? err.message : t("noNews")));
  }, [t]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <PageTitle icon={Megaphone} className="text-4xl">{t("news")}</PageTitle>
      <p className="mt-3 max-w-2xl text-muted">{t("newsLead")}</p>
      <div className="mt-8">
        {error ? (
          <EmptyState title={error} icon={Megaphone} />
        ) : !items ? (
          <Skeleton className="h-64" />
        ) : items.length === 0 ? (
          <EmptyState title={t("noNews")} icon={Megaphone} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link key={item.id} href={`/news/${item.id}`}>
                <Card className="h-full overflow-hidden p-0">
                  <NewsImage
                    src={item.imageUrl}
                    alt=""
                    className="h-44 w-full object-cover"
                    fallbackClassName="h-44 w-full"
                  />
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-widest text-gold">
                      {formatDate(item.publishedAt ?? item.createdAt)}
                    </p>
                    <h2 className="mt-2 font-display text-xl">{item.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm text-muted">{item.content}</p>
                    <p className="mt-3 text-xs text-muted">{item.authorName}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

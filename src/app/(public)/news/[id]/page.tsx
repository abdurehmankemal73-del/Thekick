"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
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
  extraImages: Array<{ id: string; url: string }>;
};

export default function NewsDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ announcement: NewsItem }>(`/api/announcements/${params.id}`)
      .then((res) => setItem(res.announcement))
      .catch((err) => setError(err instanceof ApiError ? err.message : t("pageNotFound")));
  }, [params.id, t]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title={error} icon={Megaphone} />
        <Button asChild className="mt-6" variant="outline">
          <Link href="/news">
            <Icon icon={ArrowLeft} />
            {t("news")}
          </Link>
        </Button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Button asChild variant="outline" size="sm">
        <Link href="/news">
          <Icon icon={ArrowLeft} />
          {t("news")}
        </Link>
      </Button>
      <p className="mt-6 text-xs uppercase tracking-widest text-gold">
        {formatDate(item.publishedAt ?? item.createdAt)} · {item.authorName}
      </p>
      <h1 className="mt-2 text-4xl">{item.title}</h1>
      {item.imageUrl ? (
        <NewsImage
          src={item.imageUrl}
          alt=""
          className="mt-8 max-h-[28rem] w-full rounded-2xl object-cover"
          fallbackClassName="mt-8 h-56 w-full rounded-2xl"
        />
      ) : null}
      <Card className="mt-8">
        <p className="whitespace-pre-line text-sm leading-7 text-muted">{item.content}</p>
      </Card>
      {item.extraImages.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {item.extraImages.map((image) => (
            <NewsImage
              key={image.id}
              src={image.url}
              alt=""
              className="w-full rounded-xl object-cover"
              fallbackClassName="h-40 w-full rounded-xl"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import { EmptyState, Skeleton } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/icon";
import { EventCalendar, type CalendarEventItem } from "@/components/event-calendar";
import { useI18n } from "@/i18n/provider";

export default function CalendarPage() {
  const { t } = useI18n();
  const [events, setEvents] = useState<CalendarEventItem[] | null>(null);

  useEffect(() => {
    api<{ events: CalendarEventItem[] }>("/api/events").then((res) => setEvents(res.events));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <PageTitle icon={CalendarDays} className="text-4xl">{t("navCalendar")}</PageTitle>
      <p className="mt-3 max-w-2xl text-muted">{t("calendarLead")}</p>
      <div className="mt-8">
        {!events ? (
          <Skeleton className="h-96" />
        ) : events.length === 0 ? (
          <EmptyState title={t("noEvents")} icon={CalendarDays} />
        ) : (
          <EventCalendar events={events} />
        )}
      </div>
    </div>
  );
}

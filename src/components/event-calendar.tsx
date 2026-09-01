"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn, dateInputValue, formatDateTime } from "@/lib/utils";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import type { EventType } from "@/db/schema";

export type CalendarEventItem = {
  id: string;
  title: string;
  description: string;
  eventType: EventType;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  location: string | null;
  status?: "DRAFT" | "PUBLISHED";
};

const typeTone: Record<EventType, string> = {
  TRAINING: "bg-gold/20 text-ink border-gold/40",
  BELT_EXAM: "bg-red/15 text-red border-red/30",
  COMPETITION: "bg-blue-100 text-blue-900 border-blue-200",
  GRADUATION: "bg-red text-white border-red",
  MEETING: "bg-neutral-100 text-neutral-800 border-neutral-300",
  SPECIAL: "bg-gold text-ink border-gold",
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function EventCalendar({
  events,
  onSelectEvent,
  selectedEventId,
}: {
  events: CalendarEventItem[];
  onSelectEvent?: (event: CalendarEventItem) => void;
  selectedEventId?: string | null;
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(dateInputValue(new Date()));

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const startWeekday = (first.getDay() + 6) % 7;
    const grid: Date[] = [];
    const begin = new Date(first);
    begin.setDate(first.getDate() - startWeekday);
    for (let i = 0; i < 42; i += 1) {
      const day = new Date(begin);
      day.setDate(begin.getDate() + i);
      grid.push(day);
    }
    return grid;
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const event of events) {
      const key = dateInputValue(event.startsAt);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const selectedEvents = byDay.get(selected) ?? [];
  const upcoming = events
    .filter((event) => new Date(event.startsAt) >= new Date(new Date().toDateString()))
    .slice(0, 6);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,1fr)]">
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <Button variant="outline" size="sm" onClick={() => setCursor((value) => addMonths(value, -1))}>
            <Icon icon={ChevronLeft} />
          </Button>
          <p className="font-display text-lg">
            {cursor.toLocaleString("en-GB", { month: "long", year: "numeric" })}
          </p>
          <Button variant="outline" size="sm" onClick={() => setCursor((value) => addMonths(value, 1))}>
            <Icon icon={ChevronRight} />
          </Button>
        </div>
        <div className="grid grid-cols-7 border-b border-line bg-surface text-center text-[11px] font-semibold uppercase tracking-widest text-muted">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="px-1 py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = dateInputValue(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const isSelected = key === selected;
            const items = byDay.get(key) ?? [];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  "min-h-20 border-b border-r border-line p-1.5 text-left text-sm",
                  !inMonth && "bg-surface/60 text-muted",
                  isSelected && "bg-gold/15",
                )}
              >
                <span className="text-xs font-semibold">{day.getDate()}</span>
                <div className="mt-1 space-y-1">
                  {items.slice(0, 2).map((event) => (
                    <span
                      key={event.id}
                      className={cn("block truncate rounded px-1 py-0.5 text-[10px] font-semibold", typeTone[event.eventType])}
                    >
                      {event.title}
                    </span>
                  ))}
                  {items.length > 2 ? (
                    <span className="text-[10px] text-muted">+{items.length - 2}</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Selected day</p>
          <p className="mt-1 font-display text-xl">{selected}</p>
          {selectedEvents.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No events on this day.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {selectedEvents.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-line p-3 text-left hover:border-gold"
                    onClick={() => onSelectEvent?.(event)}
                  >
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-xs text-gold">{EVENT_TYPE_LABELS[event.eventType]}</p>
                    <p className="mt-1 text-xs text-muted">
                      {event.allDay ? "All day" : formatDateTime(event.startsAt)}
                    </p>
                    {event.location ? (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                        <Icon icon={MapPin} />
                        {event.location}
                      </p>
                    ) : null}
                    <p className="mt-2 line-clamp-3 text-sm text-muted">{event.description}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Upcoming</p>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No upcoming events.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {upcoming.map((event) => (
                <li key={event.id} className="flex items-start justify-between gap-2">
                  <button type="button" className="text-left" onClick={() => onSelectEvent?.(event)}>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted">{formatDateTime(event.startsAt)}</p>
                  </button>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", typeTone[event.eventType])}>
                    {EVENT_TYPE_LABELS[event.eventType]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

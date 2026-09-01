"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/fields";
import { EmptyState, Skeleton } from "@/components/ui/empty-state";
import { Icon, PageTitle } from "@/components/ui/icon";
import { EventCalendar, type CalendarEventItem } from "@/components/event-calendar";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/constants";
import { dateInputValue, timeInputValue } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

const emptyForm = {
  title: "",
  description: "",
  eventType: "TRAINING",
  date: dateInputValue(new Date()),
  startTime: "05:30",
  endTime: "",
  allDay: false,
  location: "",
  status: "PUBLISHED",
};

export default function AdminCalendarPage() {
  const { t } = useI18n();
  const [events, setEvents] = useState<CalendarEventItem[] | null>(null);
  const [editing, setEditing] = useState<CalendarEventItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    api<{ events: CalendarEventItem[] }>("/api/admin/events").then((res) => setEvents(res.events));
  }

  useEffect(() => {
    load();
  }, []);

  function fill(event: CalendarEventItem | null) {
    setEditing(event);
    if (!event) {
      setForm(emptyForm);
      return;
    }
    setForm({
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      date: dateInputValue(event.startsAt),
      startTime: event.allDay ? "" : timeInputValue(event.startsAt),
      endTime: event.allDay ? "" : timeInputValue(event.endsAt),
      allDay: event.allDay,
      location: event.location ?? "",
      status: event.status ?? "PUBLISHED",
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      startTime: form.allDay ? null : form.startTime,
      endTime: form.allDay || !form.endTime ? null : form.endTime,
    };
    try {
      if (editing) {
        await api(`/api/admin/events/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Event updated");
      } else {
        await api("/api/admin/events", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Event created");
      }
      fill(null);
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save event");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/admin/events/${id}`, { method: "DELETE" });
      toast.success("Event deleted");
      setConfirmId(null);
      if (editing?.id === id) fill(null);
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle icon={CalendarDays}>{t("navCalendar")}</PageTitle>
      {!events ? (
        <Skeleton className="h-96" />
      ) : events.length === 0 ? (
        <EmptyState title={t("noEvents")} icon={CalendarDays} />
      ) : (
        <EventCalendar events={events} onSelectEvent={fill} selectedEventId={editing?.id} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl">{editing ? "Edit event" : "Create event"}</h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="eventType">Event type</Label>
              <Select id="eventType" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>{EVENT_TYPE_LABELS[type]}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.allDay}
                onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
              />
              All day
            </label>
            {form.allDay ? null : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startTime">Start time</Label>
                  <Input id="startTime" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="endTime">End time</Label>
                  <Input id="endTime" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="status">Visibility</Label>
              <Select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                <Icon icon={editing ? Save : Plus} />
                {saving ? "Saving…" : editing ? "Save event" : "Create event"}
              </Button>
              {editing ? (
                <Button type="button" variant="outline" onClick={() => fill(null)}>
                  <Icon icon={X} />
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
        <div className="space-y-3">
          {(events ?? []).map((event) => (
            <Card key={event.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{event.title}</p>
                <p className="text-xs text-muted">{EVENT_TYPE_LABELS[event.eventType]} · {dateInputValue(event.startsAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => fill(event)}>
                  <Icon icon={Pencil} />
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setConfirmId(event.id)}>
                  <Icon icon={Trash2} />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {confirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/60 p-4">
          <Card className="max-w-md">
            <h2 className="text-xl">Delete this event?</h2>
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

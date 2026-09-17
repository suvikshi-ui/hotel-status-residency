import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGate } from "@/components/security-gate";
import { SaveCube, useAccountSave } from "@/components/save-cube";
import { formatDay, uid } from "@/lib/format";
import {
  parseRepeat,
  reminderIsDue,
  todayIso,
  type HotelReminder,
  type ReminderRepeat,
} from "@/lib/reminders";
import { useLedger } from "@/lib/store";

export const Route = createFileRoute("/reminders")({
  component: RemindersPage,
});

function RemindersPage() {
  const reminders = useLedger((s) => s.reminders);
  const setReminders = useLedger((s) => s.setReminders);
  const { busy: saving, saveToServer } = useAccountSave();
  const { gate } = useGate();
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayIso());
  const [repeat, setRepeat] = useState<ReminderRepeat>("monthly");
  const today = todayIso();

  function addRow() {
    const text = note.trim();
    if (!text) {
      toast.error("Write what to remind");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      toast.error("Pick a date");
      return;
    }
    gate(
      () => {
        const row: HotelReminder = {
          id: uid("rm"),
          note: text,
          date,
          repeat,
        };
        setReminders([...reminders, row]);
        setNote("");
        toast.success("Reminder saved");
      },
      {
        title: "Save this reminder?",
        message: `${text} · ${formatDay(date)} · ${repeat}`,
        confirmLabel: "Save",
      },
    );
  }

  function removeRow(id: string) {
    const row = reminders.find((r) => r.id === id);
    gate(
      () => {
        setReminders(reminders.filter((r) => r.id !== id));
        toast.success("Reminder removed");
      },
      {
        title: "Delete this reminder?",
        message: row?.note ?? "Remove this reminder?",
        confirmLabel: "Delete",
        danger: true,
      },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Desk
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Reminder
          </h1>
          <p className="mt-1 text-sm text-muted">
            On that date the website will pop up: this is your reminder.
          </p>
        </div>
        <SaveCube busy={saving} onSave={() => void saveToServer()} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New reminder</CardTitle>
          <p className="text-sm text-muted">
            Description, date, then monthly or yearly.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 lg:grid-cols-[1fr_11rem_10rem_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              addRow();
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="reminder-note">Description</Label>
              <Input
                id="reminder-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What to remind"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="reminder-date">Date</Label>
              <Input
                id="reminder-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Repeat</Label>
              <Select
                value={repeat}
                onValueChange={(v) => setRepeat(parseRepeat(v))}
              >
                <SelectTrigger aria-label="Repeat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Repeat</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {reminders.map((r) => {
                const due = reminderIsDue(r, today);
                return (
                  <tr key={r.id} className="border-b border-border/70">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        {due ? (
                          <Bell className="size-4 shrink-0 text-due" />
                        ) : null}
                        {r.note}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 tabular text-muted">
                      {formatDay(r.date)}
                    </td>
                    <td className="px-3 py-2.5 capitalize">{r.repeat}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 min-h-9 text-muted hover:text-danger"
                        aria-label={`Delete ${r.note}`}
                        onClick={() => removeRow(r.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {reminders.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              No reminders yet.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

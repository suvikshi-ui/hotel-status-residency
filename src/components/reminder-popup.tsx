import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDay } from "@/lib/format";
import {
  dueReminders,
  markReminderSeen,
  readSeenReminders,
  reminderSeenKey,
  REPEAT_LABEL,
  todayIso,
} from "@/lib/reminders";
import { useLedger } from "@/lib/store";

export function ReminderPopup() {
  const reminders = useLedger((s) => s.reminders);
  const today = todayIso();
  const [tick, setTick] = useState(0);
  const pending = useMemo(() => {
    const seen = readSeenReminders();
    return dueReminders(reminders, today).filter(
      (row) => !seen[reminderSeenKey(row.id, today)],
    );
  }, [reminders, today, tick]);
  const current = pending[0] ?? null;

  function dismiss() {
    if (!current) return;
    markReminderSeen(current.id, today);
    setTick((n) => n + 1);
  }

  return (
    <Dialog open={Boolean(current)} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="size-5 text-due" />
            This is your reminder
          </DialogTitle>
          <DialogDescription>
            {current
              ? `${formatDay(today)} · ${REPEAT_LABEL[current.repeat]}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <p className="text-base leading-relaxed text-fg">{current?.note}</p>
        <div className="flex justify-end">
          <Button type="button" onClick={dismiss}>
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { getDaysInMonth, isValid, parseISO } from "date-fns";

export const REMINDER_REPEATS = [
  "monthly",
  "quarterly",
  "half",
  "yearly",
  "manual",
] as const;

export type ReminderRepeat = (typeof REMINDER_REPEATS)[number];

export const REPEAT_LABEL: Record<ReminderRepeat, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  half: "Half year",
  yearly: "Yearly",
  manual: "Manual",
};

const REPEAT_MONTHS: Record<Exclude<ReminderRepeat, "manual">, number> = {
  monthly: 1,
  quarterly: 3,
  half: 6,
  yearly: 12,
};

export interface HotelReminder {
  id: string;
  note: string;
  date: string;
  repeat: ReminderRepeat;
}

export const REMINDER_SEEN_KEY = "hsr-reminder-seen-v1";

export function parseRepeat(value: unknown): ReminderRepeat {
  return REMINDER_REPEATS.includes(value as ReminderRepeat)
    ? (value as ReminderRepeat)
    : "monthly";
}

export function normalizeReminders(raw: unknown): HotelReminder[] {
  if (!Array.isArray(raw)) return [];
  const out: HotelReminder[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const note = typeof r.note === "string" ? r.note.trim() : "";
    const date =
      typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date.slice(0, 10))
        ? r.date.slice(0, 10)
        : "";
    if (!id || !note || !date) continue;
    out.push({ id, note, date, repeat: parseRepeat(r.repeat) });
  }
  return out.sort(
    (a, b) => a.date.localeCompare(b.date) || a.note.localeCompare(b.note),
  );
}

export function remindersFromHotel(hotel: unknown): HotelReminder[] {
  if (!hotel || typeof hotel !== "object") return [];
  return normalizeReminders((hotel as { _reminders?: unknown })._reminders);
}

export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function monthsApart(from: Date, to: Date) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

export function reminderIsDue(row: HotelReminder, iso: string): boolean {
  if (!iso) return false;
  const day = parseISO(iso);
  const start = parseISO(row.date);
  if (!isValid(day) || !isValid(start)) return false;
  if (row.repeat === "manual") return iso === row.date;
  if (iso < row.date) return false;
  const gap = monthsApart(start, day);
  const every = REPEAT_MONTHS[row.repeat];
  if (gap < 0 || gap % every !== 0) return false;
  const target = Math.min(start.getDate(), getDaysInMonth(day));
  return day.getDate() === target;
}

export function dueReminders(
  rows: HotelReminder[],
  iso = todayIso(),
): HotelReminder[] {
  return rows.filter((row) => reminderIsDue(row, iso));
}

export function reminderSeenKey(id: string, iso: string) {
  return `${id}:${iso}`;
}

export function readSeenReminders(): Record<string, true> {
  try {
    const raw = localStorage.getItem(REMINDER_SEEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, true> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v) out[k] = true;
    }
    return out;
  } catch {
    return {};
  }
}

export function markReminderSeen(id: string, iso: string) {
  const next = { ...readSeenReminders(), [reminderSeenKey(id, iso)]: true as const };
  try {
    localStorage.setItem(REMINDER_SEEN_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

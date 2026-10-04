import type { DayBooks, GuestEntry, ModeAmount, NamedAmount } from "./types";

export type MonthCarry = {
  cash: number;
  santosh: number;
  pk: number;
  online: number;
  outstanding: number;
};

export type MonthArchive = {
  month: string;
  savedAt: string;
  carry: MonthCarry;
  guests: GuestEntry[];
  food: ModeAmount[];
  wholesale: ModeAmount[];
  expenses: NamedAmount[];
  balReceived: NamedAmount[];
  days: DayBooks[];
};

function monthOk(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function normalizeMonthArchives(raw: unknown): MonthArchive[] {
  if (!Array.isArray(raw)) return [];
  const out: MonthArchive[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const item = row as Partial<MonthArchive>;
    if (!monthOk(item.month)) continue;
    const carry = item.carry ?? { cash: 0, santosh: 0, pk: 0, online: 0, outstanding: 0 };
    out.push({
      month: item.month,
      savedAt: typeof item.savedAt === "string" ? item.savedAt : "",
      carry: {
        cash: num(carry.cash),
        santosh: num(carry.santosh),
        pk: num(carry.pk),
        online: num(carry.online),
        outstanding: num(carry.outstanding),
      },
      guests: asArray(item.guests),
      food: asArray(item.food),
      wholesale: asArray(item.wholesale),
      expenses: asArray(item.expenses),
      balReceived: asArray(item.balReceived),
      days: asArray(item.days),
    });
  }
  return keepMonthArchives([out]);
}

export function monthArchivesFromHotel(hotel: unknown): MonthArchive[] {
  if (!hotel || typeof hotel !== "object") return [];
  return normalizeMonthArchives((hotel as { _monthArchives?: unknown })._monthArchives);
}

/** Keep the fuller copy of a month. A later thin copy never wipes it. */
export function keepMonthArchives(lists: MonthArchive[][]): MonthArchive[] {
  const byMonth = new Map<string, MonthArchive>();
  for (const list of lists) {
    for (const row of list) {
      if (!monthOk(row.month)) continue;
      const prev = byMonth.get(row.month);
      if (!prev) {
        byMonth.set(row.month, row);
        continue;
      }
      const size = (item: MonthArchive) =>
        item.guests.length + item.days.length + item.expenses.length + item.food.length;
      if (size(row) > size(prev)) byMonth.set(row.month, row);
    }
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

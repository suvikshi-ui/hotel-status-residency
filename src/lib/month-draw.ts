export interface MonthDraw {
  month: string;
  cash: number;
  santosh: number;
  pk: number;
}

function amount(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

export function normalizeMonthDraws(raw: unknown): MonthDraw[] {
  if (!Array.isArray(raw)) return [];
  const out: MonthDraw[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const month = typeof r.month === "string" ? r.month.slice(0, 7) : "";
    if (!/^\d{4}-\d{2}$/.test(month) || seen.has(month)) continue;
    const cash = amount(r.cash);
    const santosh = amount(r.santosh);
    const pk = amount(r.pk);
    if (!cash && !santosh && !pk) continue;
    seen.add(month);
    out.push({ month, cash, santosh, pk });
  }
  return out.sort((a, b) => a.month.localeCompare(b.month));
}

export function monthDrawsFromHotel(hotel: unknown): MonthDraw[] {
  if (!hotel || typeof hotel !== "object") return [];
  return normalizeMonthDraws((hotel as { _monthDraws?: unknown })._monthDraws);
}

export function drawForMonth(draws: MonthDraw[] | undefined, month: string) {
  return (
    draws?.find((row) => row.month === month) ?? {
      month,
      cash: 0,
      santosh: 0,
      pk: 0,
    }
  );
}

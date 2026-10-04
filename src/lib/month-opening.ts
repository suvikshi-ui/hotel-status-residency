export interface MonthOpening {
  month: string;
  cash: number;
  santosh: number;
  pk: number;
  online: number | null;
  outstanding: number | null;
}

function amount(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

function amountOrCarry(value: unknown): number | null {
  if (value == null || value === "") return null;
  return amount(value);
}

export function normalizeMonthOpenings(raw: unknown): MonthOpening[] {
  if (!Array.isArray(raw)) return [];
  const out: MonthOpening[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const month = typeof r.month === "string" ? r.month.slice(0, 7) : "";
    if (!/^\d{4}-\d{2}$/.test(month) || seen.has(month)) continue;
    seen.add(month);
    const hasBalance = "outstanding" in r && r.outstanding != null && r.outstanding !== "";
    out.push({
      month,
      cash: amount(r.cash),
      santosh: amount(r.santosh),
      pk: amount(r.pk),
      online: hasBalance ? amount(r.online) : null,
      outstanding: hasBalance ? amountOrCarry(r.outstanding) : null,
    });
  }
  return out.sort((a, b) => a.month.localeCompare(b.month));
}

export function monthOpeningsFromHotel(hotel: unknown): MonthOpening[] {
  if (!hotel || typeof hotel !== "object") return [];
  return normalizeMonthOpenings(
    (hotel as { _monthOpenings?: unknown })._monthOpenings,
  );
}

export function openingForMonth(rows: MonthOpening[] | undefined, month: string) {
  return rows?.find((row) => row.month === month) ?? null;
}

export const CASH_NOTES = [500, 200, 100, 50, 20, 10] as const;

export type CashCount = {
  id: string;
  date: string;
  notes: Record<string, number>;
  coins: number;
};

export function emptyCashNotes(): Record<string, number> {
  return Object.fromEntries(CASH_NOTES.map((note) => [String(note), 0]));
}

export function cashCountTotal(row: Pick<CashCount, "notes" | "coins">) {
  const notes = CASH_NOTES.reduce(
    (sum, note) => sum + note * (Number(row.notes[String(note)]) || 0),
    0,
  );
  return notes + (Number(row.coins) || 0);
}

export function normalizeCashCounts(rows: unknown): CashCount[] {
  if (!Array.isArray(rows)) return [];
  const byDate = new Map<string, CashCount>();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const date = String(rec.date ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const src =
      rec.notes && typeof rec.notes === "object"
        ? (rec.notes as Record<string, unknown>)
        : {};
    const notes = emptyCashNotes();
    for (const note of CASH_NOTES) {
      notes[String(note)] = Math.max(0, Math.round(Number(src[String(note)]) || 0));
    }
    byDate.set(date, {
      id: `cc-${date}`,
      date,
      notes,
      coins: Math.max(0, Math.round(Number(rec.coins) || 0)),
    });
  }
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}

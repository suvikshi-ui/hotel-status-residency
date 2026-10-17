export const CASH_NOTES = [500, 200, 100, 50, 20, 10] as const;
export const CASH_ADJUST_ROWS = 4;

export type CashAdjust = {
  description: string;
  amount: number;
  side: "add" | "less";
};

export type CashCount = {
  id: string;
  date: string;
  notes: Record<string, number>;
  coins: number;
  lines: CashAdjust[];
};

export function emptyCashNotes(): Record<string, number> {
  return Object.fromEntries(CASH_NOTES.map((note) => [String(note), 0]));
}

export function emptyCashLines(): CashAdjust[] {
  return Array.from({ length: CASH_ADJUST_ROWS }, () => ({
    description: "",
    amount: 0,
    side: "less" as const,
  }));
}

export function cashAdjustNet(lines: CashAdjust[] | undefined) {
  return (lines ?? []).reduce((sum, line) => {
    const amount = Math.max(0, Math.round(Number(line.amount) || 0));
    if (!amount) return sum;
    return sum + (line.side === "add" ? amount : -amount);
  }, 0);
}

export function cashCountTotal(row: Pick<CashCount, "notes" | "coins"> & { lines?: CashAdjust[] }) {
  const notes = CASH_NOTES.reduce(
    (sum, note) => sum + note * (Number(row.notes[String(note)]) || 0),
    0,
  );
  return notes + (Number(row.coins) || 0) + cashAdjustNet(row.lines);
}

function readLines(value: unknown): CashAdjust[] {
  const src = Array.isArray(value) ? value : [];
  const lines = src.slice(0, CASH_ADJUST_ROWS).map((item) => {
    const rec = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const side = rec.side === "add" ? "add" : "less";
    return {
      description: String(rec.description ?? "").slice(0, 120),
      amount: Math.max(0, Math.round(Number(rec.amount) || 0)),
      side,
    } as CashAdjust;
  });
  while (lines.length < CASH_ADJUST_ROWS) {
    lines.push({ description: "", amount: 0, side: "less" });
  }
  return lines;
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
      lines: readLines(rec.lines),
    });
  }
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}

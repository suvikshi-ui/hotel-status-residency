import type { AdvanceRow, StaffRow } from "./types";

export type PayrollKind = "salary" | "advance";

export interface PayrollFile {
  id: string;
  kind: PayrollKind;
  period: string;
  createdAt: string;
  staff: StaffRow[];
  advances: AdvanceRow[];
}

export function payrollFileId(kind: PayrollKind, period: string) {
  return `pfile:${kind}:${period.slice(0, 7)}`;
}

export function normalizePayrollFiles(rows: PayrollFile[] | undefined | null): PayrollFile[] {
  const out: PayrollFile[] = [];
  const seen = new Set<string>();
  for (const row of rows ?? []) {
    if (!row?.id || seen.has(row.id)) continue;
    if (row.kind !== "salary" && row.kind !== "advance") continue;
    const period = (row.period || "").slice(0, 7);
    if (!period) continue;
    seen.add(row.id);
    out.push({
      id: row.id,
      kind: row.kind,
      period,
      createdAt: (row.createdAt || period).slice(0, 10),
      staff: Array.isArray(row.staff) ? row.staff : [],
      advances: Array.isArray(row.advances) ? row.advances : [],
    });
  }
  return out.sort((a, b) => b.period.localeCompare(a.period) || a.kind.localeCompare(b.kind));
}

export function blankSalaryMonth(rows: StaffRow[], period: string): StaffRow[] {
  return rows.map((row) => ({
    ...row,
    month: period,
    working: 0,
    extra: 0,
    absent: 0,
    advance: 0,
    total: 0,
    status: "",
  }));
}

export function blankAdvanceMonth(rows: AdvanceRow[], period: string): AdvanceRow[] {
  return rows.map((row) => ({
    ...row,
    month: period,
    cash: 0,
    qrs: 0,
  }));
}

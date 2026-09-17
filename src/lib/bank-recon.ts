import { uid } from "./format.ts";
import type { GuestEntry } from "./types";

export interface BankRow {
  id: string;
  date: string;
  particular: string;
  amount: number;
  ref: string;
  month: string;
}

export interface OfficeHit {
  id: string;
  date: string;
  name: string;
  source: string | null;
  amount: number;
  ref: string;
}

export interface ReconLine {
  bank: BankRow;
  office: OfficeHit | null;
}

export function normalizeRef(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function bankRowsFromHotel(hotel: unknown): BankRow[] {
  if (!hotel || typeof hotel !== "object") return [];
  return normalizeBankRows((hotel as { _bankRows?: unknown })._bankRows);
}

export function normalizeBankRows(raw: unknown): BankRow[] {
  if (!Array.isArray(raw)) return [];
  const out: BankRow[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const date =
      typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date.slice(0, 10))
        ? r.date.slice(0, 10)
        : parseLooseDate(String(r.date ?? ""));
    const particular = typeof r.particular === "string" ? r.particular.trim() : "";
    const ref = typeof r.ref === "string" ? r.ref.trim() : "";
    const amount = Number(r.amount);
    if (!date || !Number.isFinite(amount) || amount === 0) continue;
    const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : uid("bk");
    const next: BankRow = {
      id,
      date,
      particular,
      amount,
      ref,
      month: date.slice(0, 7),
    };
    const key = bankKey(next);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(next);
  }
  return out.sort(
    (a, b) => a.date.localeCompare(b.date) || a.particular.localeCompare(b.particular),
  );
}

export function bankKey(row: Pick<BankRow, "date" | "amount" | "ref" | "particular">) {
  return `${row.date}|${row.amount}|${normalizeRef(row.ref)}|${row.particular.slice(0, 24).toLowerCase()}`;
}

export function mergeBankRows(current: BankRow[], incoming: BankRow[], month?: string) {
  const keep = month ? current.filter((r) => r.month !== month) : current.slice();
  const seen = new Set(keep.map(bankKey));
  for (const row of incoming) {
    if (month && row.month !== month) continue;
    const key = bankKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    keep.push(row);
  }
  return normalizeBankRows(keep);
}

export function officeHitsFromGuests(guests: GuestEntry[]): OfficeHit[] {
  const out: OfficeHit[] = [];
  for (const g of guests) {
    const refs = [g.payRefNo, g.gstInvoiceNo].filter(
      (v): v is string => Boolean(v && v.trim()),
    );
    const unique = [...new Set(refs.map((v) => v.trim()))];
    for (const ref of unique) {
      out.push({
        id: g.id,
        date: g.date,
        name: g.name,
        source: g.source ?? null,
        amount: g.amount,
        ref,
      });
    }
  }
  return out;
}

export function reconcileBank(
  bankRows: BankRow[],
  guests: GuestEntry[],
): ReconLine[] {
  const offices = officeHitsFromGuests(guests);
  const used = new Set<string>();
  return bankRows.map((bank) => {
    const office = pickOffice(bank, offices, used);
    return { bank, office };
  });
}

function pickOffice(
  bank: BankRow,
  offices: OfficeHit[],
  used: Set<string>,
): OfficeHit | null {
  const key = normalizeRef(bank.ref);
  if (key.length < 4) return null;
  const hits = offices.filter(
    (o) => !used.has(o.id + o.ref) && normalizeRef(o.ref) === key,
  );
  if (!hits.length) return null;
  const sameAmt = hits.find((h) => Math.abs(h.amount - bank.amount) < 0.51);
  const sameDay = hits.find((h) => h.date === bank.date);
  const hit = sameAmt ?? sameDay ?? hits[0];
  used.add(hit.id + hit.ref);
  return hit;
}

const DATE_HEAD = /date|txn.?dt|value.?date|posting/i;
const NARR_HEAD = /narrat|desc|particular|remark|detail|info|narration/i;
const CREDIT_HEAD = /^amount$|deposit|credit|^cr$|cr amount/i;
const DEBIT_HEAD = /debit|withdrawal|^dr$|dr amount/i;
const REF_HEAD = /ref|cheque|chq|utr|txn.?id|transaction.?id|payment.?ref|rrn/i;

export function parseStatementText(text: string): BankRow[] {
  const raw = text.replace(/^\uFEFF/, "").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const delim = guessDelim(lines[0] ?? "");
  const headerCells = splitRow(lines[0] ?? "", delim).map((c) => c.trim());
  const mapped = mapHeaders(headerCells);
  if (mapped.date >= 0 && (mapped.amount >= 0 || mapped.credit >= 0 || mapped.debit >= 0)) {
    return normalizeBankRows(
      lines.slice(1).map((line) => rowFromCells(splitRow(line, delim), mapped)),
    );
  }
  return normalizeBankRows(lines.map(rowFromLooseLine).filter(Boolean));
}

function guessDelim(header: string) {
  const counts = [
    { d: ",", n: (header.match(/,/g) ?? []).length },
    { d: "\t", n: (header.match(/\t/g) ?? []).length },
    { d: ";", n: (header.match(/;/g) ?? []).length },
    { d: "|", n: (header.match(/\|/g) ?? []).length },
  ].sort((a, b) => b.n - a.n);
  return counts[0] && counts[0].n > 0 ? counts[0].d : ",";
}

function splitRow(line: string, delim: string) {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      q = !q;
      continue;
    }
    if (ch === delim && !q) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function mapHeaders(cells: string[]) {
  const mapped = { date: -1, particular: -1, amount: -1, credit: -1, debit: -1, ref: -1 };
  cells.forEach((cell, i) => {
    if (mapped.date < 0 && DATE_HEAD.test(cell)) mapped.date = i;
    else if (mapped.ref < 0 && REF_HEAD.test(cell)) mapped.ref = i;
    else if (mapped.particular < 0 && NARR_HEAD.test(cell)) mapped.particular = i;
    else if (mapped.debit < 0 && DEBIT_HEAD.test(cell)) mapped.debit = i;
    else if (mapped.credit < 0 && CREDIT_HEAD.test(cell)) mapped.credit = i;
    else if (mapped.amount < 0 && /amount/i.test(cell)) mapped.amount = i;
  });
  return mapped;
}

function rowFromCells(
  cells: string[],
  mapped: ReturnType<typeof mapHeaders>,
): Partial<BankRow> | null {
  const date = parseLooseDate(cells[mapped.date] ?? "");
  if (!date) return null;
  const credit = parseAmount(cells[mapped.credit] ?? "");
  const debit = parseAmount(cells[mapped.debit] ?? "");
  const amountCol = parseAmount(cells[mapped.amount] ?? "");
  const amount = credit || (mapped.credit >= 0 || mapped.debit >= 0 ? credit - debit : amountCol);
  const particular = (cells[mapped.particular] ?? "").trim();
  const ref =
    (mapped.ref >= 0 ? cells[mapped.ref] : "").trim() || extractRef(particular);
  return { date, particular, amount, ref };
}

function rowFromLooseLine(line: string): Partial<BankRow> | null {
  const date = parseLooseDate(line);
  if (!date) return null;
  const amounts = [...line.matchAll(/(?:\u20B9\s*)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})/g)];
  if (!amounts.length) return null;
  const last = amounts[amounts.length - 1];
  const amount = parseAmount(last[0] ?? "");
  const particular = line.replace(last[0] ?? "", "").replace(date, "").trim();
  return {
    date,
    particular,
    amount,
    ref: extractRef(line),
  };
}

function extractRef(text: string) {
  const hit =
    text.match(/\b(?:UPI|IMPS|NEFT|RTGS|UTR|RRN)[:\/\-]?[A-Z0-9]{6,}\b/i) ??
    text.match(/\b[A-Z0-9]{10,}\b/);
  return hit?.[0] ?? "";
}

function parseAmount(raw: string) {
  const t = raw.replace(/[^\d.\-]/g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

export function parseLooseDate(raw: string): string {
  const t = raw.trim();
  const iso = t.match(/\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/);
  if (iso) return ymd(iso[1], iso[2], iso[3]);
  const dmy = t.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return ymd(year, dmy[2], dmy[1]);
  }
  return "";
}

function ymd(y?: string, m?: string, d?: string) {
  if (!y || !m || !d) return "";
  const month = m.padStart(2, "0");
  const day = d.padStart(2, "0");
  if (Number(month) < 1 || Number(month) > 12) return "";
  if (Number(day) < 1 || Number(day) > 31) return "";
  return `${y}-${month}-${day}`;
}

export async function statementTextFromPdf(data: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const lines: string[] = [];
    let y = Number.NaN;
    let buf: string[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const ty = Math.round(((item as { transform?: number[] }).transform?.[5] ?? 0) * 4) / 4;
      if (Number.isFinite(y) && Math.abs(ty - y) > 2) {
        lines.push(buf.join(" "));
        buf = [];
      }
      y = ty;
      const str = (item as { str?: string }).str ?? "";
      if (str.trim()) buf.push(str);
    }
    if (buf.length) lines.push(buf.join(" "));
    pages.push(lines.join("\n"));
  }
  return pages.join("\n");
}

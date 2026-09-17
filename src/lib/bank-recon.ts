import { uid } from "./format.ts";
import type { GuestEntry } from "./types";

export interface BankRow {
  id: string;
  date: string;
  dateRaw: string;
  particular: string;
  debit: number;
  credit: number;
  amount: number;
  ref: string;
  dc: string;
  month: string;
  headers: string[];
  cells: string[];
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

function asText(v: unknown) {
  if (typeof v === "string") return v.trim();
  if (v == null) return "";
  return String(v).trim();
}

export function normalizeRef(value: string) {
  return asText(value).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function bankRowsFromHotel(hotel: unknown): BankRow[] {
  if (!hotel || typeof hotel !== "object") return [];
  return normalizeBankRows((hotel as { _bankRows?: unknown })._bankRows);
}

export function signedAmount(row: Pick<BankRow, "debit" | "credit" | "amount">) {
  if (row.credit) return row.credit;
  if (row.debit) return row.debit;
  return Math.abs(row.amount || 0);
}

export function normalizeBankRows(raw: unknown): BankRow[] {
  if (!Array.isArray(raw)) return [];
  const out: BankRow[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const cells = Array.isArray(r.cells)
      ? r.cells.map((c) => asText(c))
      : [];
    const headers = Array.isArray(r.headers)
      ? r.headers.map((c) => asText(c))
      : [];
    const dateRaw = asText(r.dateRaw) || asText(r.date) || cells[0] || "";
    const parsed = parseLooseDate(dateRaw);
    const date =
      typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date.slice(0, 10))
        ? r.date.slice(0, 10)
        : parsed;
    const month = asText(r.month) || (date ? date.slice(0, 7) : "");
    if (!cells.some(Boolean) && !asText(r.particular) && !dateRaw) continue;
    const split = debitCreditOf(r);
    const next: BankRow = {
      id: asText(r.id) || uid("bk"),
      date: date || (month ? `${month}-01` : ""),
      dateRaw,
      particular: asText(r.particular),
      debit: split.debit,
      credit: split.credit,
      amount: split.credit || split.debit,
      ref: asText(r.ref),
      dc: asText(r.dc),
      month,
      headers,
      cells: cells.length ? cells : fallbackCells(r),
    };
    if (!next.date && !next.cells.some(Boolean)) continue;
    const key = bankKey(next);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(next);
  }
  return out;
}

function fallbackCells(r: Record<string, unknown>) {
  return [
    asText(r.dateRaw) || asText(r.date),
    asText(r.particular),
    asText(r.ref),
    asText(r.dc),
    asText(r.debit),
    asText(r.credit),
  ];
}

function debitCreditOf(r: Record<string, unknown>) {
  const debit = Math.abs(num(r.debit));
  const credit = Math.abs(num(r.credit));
  if (debit || credit) return { debit, credit };
  const amount = num(r.amount);
  if (!amount) return { debit: 0, credit: 0 };
  if (amount < 0) return { debit: Math.abs(amount), credit: 0 };
  return { debit: 0, credit: amount };
}

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function bankKey(row: Pick<BankRow, "month" | "cells" | "date" | "ref" | "particular">) {
  if (row.cells?.length) return `${row.month}|${row.cells.join("\t")}`;
  return `${row.month}|${row.date}|${row.ref}|${row.particular}`;
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
      (v): v is string => Boolean(v && asText(v)),
    );
    const unique = [...new Set(refs.map((v) => asText(v)))].filter(Boolean);
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
  const ref = asText(bank.ref) || cellByHeader(bank, REF_HEAD);
  if (!ref) return null;
  const hits = offices.filter(
    (o) => !used.has(o.id + o.ref) && refsMatch(ref, o.ref),
  );
  if (!hits.length) return null;
  const bankAmt = signedAmount(bank);
  const sameAmt = hits.find((h) => Math.abs(h.amount - bankAmt) < 0.51);
  const sameDay = hits.find((h) => h.date === bank.date);
  const hit = sameAmt ?? sameDay ?? hits[0];
  used.add(hit.id + hit.ref);
  return hit;
}

export function refsMatch(a: string, b: string) {
  const x = normalizeRef(a);
  const y = normalizeRef(b);
  if (x.length < 4 || y.length < 4) return false;
  if (x === y) return true;
  if (x.length >= 8 && y.length >= 8 && (x.includes(y) || y.includes(x))) return true;
  const dx = x.replace(/\D/g, "");
  const dy = y.replace(/\D/g, "");
  if (dx.length >= 8 && dy.length >= 8 && (dx === dy || dx.endsWith(dy) || dy.endsWith(dx))) {
    return true;
  }
  return false;
}

function cellByHeader(row: BankRow, pattern: RegExp) {
  const i = row.headers.findIndex((h) => pattern.test(h));
  return i >= 0 ? asText(row.cells[i]) : "";
}

const DATE_HEAD = /date|txn.?dt|value.?dt/i;
const NARR_HEAD = /narrat|desc|particular/i;
const CREDIT_HEAD = /^(credit|cr|deposit|cr amount|amount credited)$/i;
const DEBIT_HEAD = /^(debit|dr|withdrawal|wdl|dr amount|amount debited)$/i;
const REF_HEAD = /ch\.?\s*\/?\s*ref|^ref$|ref\.?\s*no|cheque|chq|reference/i;
const DC_HEAD = /^(d\/c|dr\/cr|type)$/i;
const CLEAN_HEADERS = ["Date", "Narration", "Ch./Ref. no.", "Debit", "Credit"];

export function parseStatementText(text: string, month = ""): BankRow[] {
  const raw = asText(text).replace(/^\uFEFF/, "");
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).map((l) => asText(l)).filter(Boolean);
  if (!lines.length) return [];
  const grid = findGrid(lines);
  return normalizeBankRows(
    (grid ? grid.body : lines).map((line) => {
      try {
        if (isJunkLine(line)) return null;
        if (grid) {
          const cells = padCells(
            splitRow(line, grid.delim).map((c) => asText(c)),
            grid.headers.length,
          );
          if (!cells.some(Boolean)) return null;
          return slimRow(rowFromGrid(grid.headers, cells, month));
        }
        return slimRow(rowFromLoose(line, month));
      } catch {
        return null;
      }
    }),
  );
}

function findGrid(lines: string[]) {
  const limit = Math.min(lines.length, 50);
  for (let i = 0; i < limit; i++) {
    if (isJunkLine(lines[i] ?? "")) continue;
    const delim = guessDelim(lines[i] ?? "");
    if (!delim) continue;
    const headers = splitRow(lines[i] ?? "", delim).map((c) => asText(c));
    const mapped = mapHeaders(headers);
    if (mapped.date >= 0 && (mapped.debit >= 0 || mapped.credit >= 0 || mapped.particular >= 0)) {
      return { index: i, delim, headers, body: lines.slice(i + 1) };
    }
  }
  return null;
}

function rowFromGrid(headers: string[], cells: string[], month: string): Partial<BankRow> | null {
  const mapped = mapHeaders(headers);
  const dateRaw = mapped.date >= 0 ? cells[mapped.date] ?? "" : "";
  const date = parseLooseDate(dateRaw);
  if (!date) return null;
  const particular = mapped.particular >= 0 ? cells[mapped.particular] ?? "" : "";
  if (isJunkLine(particular) || isBalanceLine(particular)) return null;
  const ref = mapped.ref >= 0 ? cells[mapped.ref] ?? "" : "";
  const debitRaw = mapped.debit >= 0 ? cells[mapped.debit] ?? "" : "";
  const creditRaw = mapped.credit >= 0 ? cells[mapped.credit] ?? "" : "";
  const debit = parseAmount(debitRaw);
  const credit = parseAmount(creditRaw);
  if (!debit && !credit) return null;
  const stamp = month || date.slice(0, 7);
  return {
    date,
    dateRaw,
    particular,
    ref,
    debit,
    credit,
    amount: credit || debit,
    dc: debit && !credit ? "D" : credit ? "C" : "",
    month: stamp,
    headers: CLEAN_HEADERS,
    cells: [
      dateRaw,
      particular,
      ref,
      debit ? debitRaw || String(debit) : "",
      credit ? creditRaw || String(credit) : "",
    ],
  };
}

function rowFromLoose(line: string, month: string): Partial<BankRow> | null {
  if (isBalanceLine(line) || isJunkLine(line)) return null;
  const date = parseLooseDate(line);
  if (!date) return null;
  const dateRaw = (line.match(
    /\b(?:\d{1,2}[\s\-\/.](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-\/.,]+\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}|\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/i,
  ) ?? [""])[0];
  const amounts = [...line.matchAll(/(?:\u20B9\s*)?(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+\.\d{1,2})/g)];
  if (!amounts.length) return null;
  const txn = amounts.length >= 2 ? amounts.slice(0, -1) : amounts;
  const values = txn.map((m) => parseAmount(m[0] ?? "")).filter((n) => n);
  let debit = 0;
  let credit = 0;
  if (values.length >= 2) {
    debit = values[0] ?? 0;
    credit = values[1] ?? 0;
  } else if (/\b(dr|debit|wdl|withdrawal)\b/i.test(line)) {
    debit = values[0] ?? 0;
  } else {
    credit = values[0] ?? 0;
  }
  if (!debit && !credit) return null;
  const ref = extractRef(line);
  let particular = line;
  if (dateRaw) particular = particular.replace(dateRaw, "");
  for (const m of amounts) particular = particular.replace(m[0] ?? "", "");
  if (ref) particular = particular.replace(ref, "");
  particular = particular.replace(/\b(dr|cr|debit|credit)\b/gi, "").replace(/\s+/g, " ").trim();
  if (isJunkLine(particular) || isBalanceLine(particular)) return null;
  const stamp = month || date.slice(0, 7);
  return {
    date,
    dateRaw,
    particular,
    ref,
    debit,
    credit,
    amount: credit || debit,
    dc: debit && !credit ? "D" : "C",
    month: stamp,
    headers: CLEAN_HEADERS,
    cells: [
      dateRaw,
      particular,
      ref,
      debit ? String(debit) : "",
      credit ? String(credit) : "",
    ],
  };
}

function slimRow(row: Partial<BankRow> | null): Partial<BankRow> | null {
  if (!row) return null;
  return {
    ...row,
    headers: CLEAN_HEADERS,
    cells: [
      asText(row.dateRaw),
      asText(row.particular),
      asText(row.ref),
      row.debit ? asText(row.cells?.[3]) || String(row.debit) : "",
      row.credit ? asText(row.cells?.[4]) || String(row.credit) : "",
    ],
  };
}

function isBalanceLine(text: string) {
  const t = asText(text);
  return (
    /\b(opening|closing)\s+balance\b/i.test(t) ||
    /\bbalance\s*(b\/f|c\/f|bd|cd|brought|carried)\b/i.test(t) ||
    /\b(brought|carried)\s+forward\b/i.test(t) ||
    /^(opening|closing|available|balance|total)\b/i.test(t)
  );
}

function isJunkLine(text: string) {
  const t = asText(text);
  if (!t) return true;
  return (
    /\b(address|ifsc|branch|customer|page\s*\d|statement of|gstin|cin\b|email|e-mail|phone|mobile|pincode|pin code|account\s*(no|number|name)|registered office)\b/i.test(
      t,
    ) || isBalanceLine(t)
  );
}

function padCells(cells: string[], width: number) {
  if (cells.length >= width) return cells;
  return [...cells, ...Array.from({ length: width - cells.length }, () => "")];
}

function guessDelim(header: string) {
  const counts = [
    { d: ",", n: (header.match(/,/g) ?? []).length },
    { d: "\t", n: (header.match(/\t/g) ?? []).length },
    { d: ";", n: (header.match(/;/g) ?? []).length },
    { d: "|", n: (header.match(/\|/g) ?? []).length },
  ].sort((a, b) => b.n - a.n);
  return counts[0] && counts[0].n > 0 ? counts[0].d : "";
}

function splitRow(line: string, delim: string) {
  if (!delim) return [line];
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
  const mapped = {
    date: -1,
    particular: -1,
    credit: -1,
    debit: -1,
    ref: -1,
    dc: -1,
  };
  cells.forEach((cell, i) => {
    if (mapped.date < 0 && DATE_HEAD.test(cell)) mapped.date = i;
    else if (mapped.ref < 0 && REF_HEAD.test(cell)) mapped.ref = i;
    else if (mapped.dc < 0 && DC_HEAD.test(cell)) mapped.dc = i;
    else if (mapped.particular < 0 && NARR_HEAD.test(cell)) mapped.particular = i;
    else if (mapped.debit < 0 && DEBIT_HEAD.test(cell)) mapped.debit = i;
    else if (mapped.credit < 0 && CREDIT_HEAD.test(cell)) mapped.credit = i;
  });
  return mapped;
}

function parseAmount(raw: string) {
  const t = asText(raw).replace(/[^\d.\-]/g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

export function parseLooseDate(raw: string): string {
  const t = asText(raw);
  const iso = t.match(/\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/);
  if (iso) return ymd(iso[1], iso[2], iso[3]);
  const mon = t.match(
    /\b(\d{1,2})[\s\-\/.](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-\/.,]+(\d{2,4})\b/i,
  );
  if (mon) {
    const year = (mon[3] ?? "").length === 2 ? `20${mon[3]}` : mon[3];
    return ymd(year, monthNum(mon[2] ?? ""), mon[1]);
  }
  const dmy = t.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (dmy) {
    const year = (dmy[3] ?? "").length === 2 ? `20${dmy[3]}` : dmy[3];
    return ymd(year, dmy[2], dmy[1]);
  }
  return "";
}

function monthNum(name: string) {
  const i = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec",
  ].indexOf(asText(name).slice(0, 3).toLowerCase());
  return i < 0 ? "" : String(i + 1);
}

function ymd(y?: string, m?: string, d?: string) {
  if (!y || !m || !d) return "";
  const month = m.padStart(2, "0");
  const day = d.padStart(2, "0");
  if (Number(month) < 1 || Number(month) > 12) return "";
  if (Number(day) < 1 || Number(day) > 31) return "";
  return `${y}-${month}-${day}`;
}

export function dcOf(row: Pick<BankRow, "debit" | "credit"> & { dc?: string }) {
  const d = asText(row.dc).toUpperCase();
  if (d.startsWith("D")) return "D";
  if (d.startsWith("C")) return "C";
  if (row.debit && !row.credit) return "D";
  if (row.credit && !row.debit) return "C";
  if (row.debit && row.credit) return row.debit >= row.credit ? "D" : "C";
  return "";
}

export function extractRef(text: string) {
  const t = asText(text).replace(/\s+/g, " ");
  if (!t) return "";
  const labeled = t.match(
    /\b(?:UPI|IMPS|NEFT|RTGS|NACH|ACH|IFT|INFT|UTR|RRN)(?:[\s/.:-]{0,3}(?:DR|CR|P2A|P2P|INFT))?[\s/.:-]{0,3}([A-Z0-9]{8,})\b/i,
  );
  if (labeled?.[1]) return labeled[1];
  const tagged = t.match(
    /\b(?:CHQ|CHEQUE|CH\.?|REF(?:ERENCE)?(?:\s*NO\.?)?)[\s/.:-]*([A-Z0-9]{4,})\b/i,
  );
  if (tagged?.[1]) return tagged[1];
  const longNum = t.match(/\b(\d{12,22})\b/);
  if (longNum?.[1]) return longNum[1];
  const bankCode = t.match(/\b([A-Z]{4}[A-Z0-9]{6,})\b/i);
  if (bankCode?.[1]) return bankCode[1];
  return "";
}

export function statementCsv(headers: string[], rows: string[][]) {
  const esc = (s: string) =>
    /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  return [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

function linesFromPdfItems(items: unknown[]) {
  const rows = new Map<number, { x: number; str: string }[]>();
  for (const item of items) {
    if (!item || typeof item !== "object" || !("str" in item)) continue;
    const str = asText((item as { str?: unknown }).str);
    if (!str) continue;
    const transform = (item as { transform?: number[] }).transform ?? [];
    const x = transform[4] ?? 0;
    const y = Math.round((transform[5] ?? 0) * 2) / 2;
    const row = rows.get(y) ?? [];
    row.push({ x, str });
    rows.set(y, row);
  }
  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, cells]) => {
      cells.sort((a, b) => a.x - b.x);
      let line = cells[0]?.str ?? "";
      for (let i = 1; i < cells.length; i++) {
        const prev = cells[i - 1];
        const cur = cells[i];
        const gap = (cur?.x ?? 0) - (prev?.x ?? 0) - (prev?.str.length ?? 0) * 4;
        line += gap > 12 ? "\t" : " ";
        line += cur?.str ?? "";
      }
      return line;
    })
    .join("\n");
}

export async function statementTextFromPdf(
  data: ArrayBuffer,
  password = "",
): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  try {
    const doc = await pdfjs.getDocument({
      data,
      password: password || undefined,
    }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      try {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        pages.push(linesFromPdfItems(content.items as unknown[]));
      } catch {
        pages.push("");
      }
    }
    const text = pages.join("\n").trim();
    if (!text) {
      throw new Error(
        "This PDF has no readable text. Download CSV from net banking and upload that.",
      );
    }
    return text;
  } catch (err) {
    const name = err && typeof err === "object" && "name" in err
      ? String((err as { name?: string }).name)
      : "";
    const code = err && typeof err === "object" && "code" in err
      ? (err as { code?: unknown }).code
      : "";
    if (name === "PasswordException" || code === 1 || code === 2) {
      throw new Error(
        password
          ? "Wrong statement password"
          : "This statement is locked. Enter the password, then upload.",
      );
    }
    if (err instanceof Error && err.message) throw err;
    throw new Error("Could not read this PDF. Try CSV from net banking.");
  }
}

import { uid } from "./format.ts";
import type { GuestEntry, NamedAmount, PayMode } from "./types";

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
  reason: string;
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

type RefRow = {
  id: string;
  date: string;
  amount: number;
  mode?: PayMode;
  payRef?: string | null;
  particular?: string;
};

export function officeHitsFromGuests(guests: GuestEntry[]): OfficeHit[] {
  return officeHitsFromBooks({ guests });
}

export function officeHitsFromBooks(input: {
  guests: GuestEntry[];
  food?: RefRow[];
  wholesale?: RefRow[];
  expenses?: NamedAmount[];
  receipts?: NamedAmount[];
}): OfficeHit[] {
  const out: OfficeHit[] = [];
  const add = (hit: OfficeHit) => {
    if (!asText(hit.ref)) return;
    out.push(hit);
  };
  for (const g of input.guests) {
    add({
      id: g.id,
      date: g.date,
      name: g.name,
      source: g.source ?? null,
      reason: "room rent",
      amount: g.amount,
      ref: asText(g.payRefNo),
    });
  }
  for (const row of input.food ?? []) {
    add({
      id: row.id,
      date: row.date,
      name: "",
      source: null,
      reason: "food bill",
      amount: row.amount,
      ref: asText(row.payRef),
    });
  }
  for (const row of input.wholesale ?? []) {
    add({
      id: row.id,
      date: row.date,
      name: "",
      source: null,
      reason: "WS",
      amount: row.amount,
      ref: asText(row.payRef),
    });
  }
  for (const row of input.expenses ?? []) {
    add({
      id: row.id,
      date: row.date,
      name: "",
      source: null,
      reason: asText(row.particular),
      amount: row.amount,
      ref: asText(row.payRef),
    });
  }
  for (const row of input.receipts ?? []) {
    add({
      id: row.id,
      date: row.date,
      name: asText(row.particular),
      source: asText(row.particular) || null,
      reason: "balance received",
      amount: row.amount,
      ref: asText(row.payRef),
    });
  }
  return out;
}

export function reconcileBank(
  bankRows: BankRow[],
  guests: GuestEntry[],
  extra?: {
    food?: RefRow[];
    wholesale?: RefRow[];
    expenses?: NamedAmount[];
    receipts?: NamedAmount[];
  },
): ReconLine[] {
  const offices = officeHitsFromBooks({ guests, ...extra });
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
  const ref =
    asText(bank.ref) ||
    cellByHeader(bank, REF_HEAD) ||
    extractRef(bank.particular);
  if (!ref) return null;
  const bankKey = normalizeRef(ref);
  if (used.has(bankKey)) return null;
  const hits = offices.filter(
    (o) => !used.has(normalizeRef(o.ref)) && refsMatch(ref, o.ref),
  );
  if (!hits.length) return null;
  const seen = new Set<string>();
  const kept: OfficeHit[] = [];
  for (const hit of hits) {
    const key = hit.reason.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push(hit);
  }
  if (!kept.length) return null;
  used.add(bankKey);
  for (const hit of hits) used.add(normalizeRef(hit.ref));
  const names = [...new Set(kept.map((hit) => hit.name.trim()).filter(Boolean))];
  return {
    ...kept[0],
    id: kept.map((hit) => hit.id).join("+"),
    name: names.join(", "),
    reason: kept.map((hit) => hit.reason).join(", "),
    amount: kept.reduce((sum, hit) => sum + hit.amount, 0),
  };
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
const NARR_HEAD = /narrat|desc|particular|remarks?/i;
const CREDIT_HEAD = /credit|deposit|amount credited/i;
const DEBIT_HEAD = /debit|withdrawal|wdl|amount debited/i;
const REF_HEAD = /ch\.?\s*\/?\s*ref|^ref$|ref\.?\s*no|cheque|chq|reference/i;
const DC_HEAD = /^(d\/c|dr\/cr|type)$/i;
const CLEAN_HEADERS = ["Date", "Narration", "Ch./Ref. no.", "Withdrawal", "Deposit"];

export function parseStatementText(text: string, month = ""): BankRow[] {
  const raw = asText(text).replace(/^\uFEFF/, "");
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).map((l) => asText(l)).filter(Boolean);
  if (!lines.length) return [];
  const grid = findGrid(lines);
  const parsed: Partial<BankRow>[] = [];
  for (const line of grid ? grid.body : lines) {
    try {
      if (isBalanceLine(line)) continue;
      if (grid) {
        const cells = padCells(
          splitRow(line, grid.delim).map((c) => asText(c)),
          grid.headers.length,
        );
        if (!cells.some(Boolean)) continue;
        const row = rowFromGrid(grid.headers, cells, month);
        if (row) {
          parsed.push(row);
          continue;
        }
        const last = parsed[parsed.length - 1];
        if (last && cells.some(Boolean) && !isJunkLine(cells.join(" "))) {
          last.particular = asText(`${last.particular ?? ""} ${cells.filter(Boolean).join(" ")}`);
        }
        continue;
      }
      if (isHeaderish(line)) continue;
      const row = rowFromLoose(line, month);
      if (row) {
        parsed.push(row);
        continue;
      }
      const last = parsed[parsed.length - 1];
      if (last && !isJunkLine(line)) {
        last.particular = asText(`${last.particular ?? ""} ${line}`);
      }
    } catch {
      continue;
    }
  }
  return normalizeBankRows(parsed.map((row) => slimRow(row)));
}

function isHeaderish(line: string) {
  const mapped = mapHeaders(splitRow(line, guessDelim(line) || "\t").map((c) => asText(c)));
  return mapped.date >= 0 && (mapped.debit >= 0 || mapped.credit >= 0 || mapped.particular >= 0);
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
  if (!dateRaw && !particular) return null;
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
  const amounts = [
    ...line.matchAll(
      /(?:\u20B9\s*)?(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+\.\d{1,2})/g,
    ),
  ];
  const { withdrawal, deposit } = wdlDepFromAmounts(amounts, line);
  const ref = mappedRefFromLine(line, dateRaw);
  let particular = line;
  if (dateRaw) particular = particular.replace(dateRaw, "");
  for (const m of amounts) particular = particular.replace(m[0] ?? "", "");
  if (ref) particular = particular.replace(ref, "");
  particular = particular.replace(/\b(dr|cr|debit|credit)\b/gi, "").replace(/\s+/g, " ").trim();
  if (isBalanceLine(particular)) return null;
  const stamp = month || date.slice(0, 7);
  return {
    date,
    dateRaw,
    particular,
    ref,
    debit: withdrawal,
    credit: deposit,
    amount: deposit || withdrawal,
    dc: withdrawal && !deposit ? "D" : deposit ? "C" : "",
    month: stamp,
    headers: CLEAN_HEADERS,
    cells: [
      dateRaw,
      particular,
      ref,
      withdrawal ? String(withdrawal) : "",
      deposit ? String(deposit) : "",
    ],
  };
}

function mappedRefFromLine(line: string, dateRaw: string) {
  const withoutDate = dateRaw ? line.replace(dateRaw, "") : line;
  return extractRef(withoutDate);
}

function wdlDepFromAmounts(
  amounts: RegExpMatchArray[],
  line: string,
): { withdrawal: number; deposit: number } {
  const values = amounts.map((m) => parseAmount(m[0] ?? "")).filter((n) => Number.isFinite(n));
  if (values.length >= 3) {
    return {
      withdrawal: values[values.length - 3] ?? 0,
      deposit: values[values.length - 2] ?? 0,
    };
  }
  if (values.length === 2 || values.length === 1) {
    const txn = values[0] ?? 0;
    if (isWithdrawalNarration(line)) return { withdrawal: txn, deposit: 0 };
    return { withdrawal: 0, deposit: txn };
  }
  return { withdrawal: 0, deposit: 0 };
}

function isWithdrawalNarration(line: string) {
  return /\b(atm|pos|charge|fee|wdl|withdrawal|neft\s*out|rtgs\s*out|imps\s*out|by\s+clg|debit\s+card)\b/i.test(
    line,
  );
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
    if (/balance/i.test(cell)) return;
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

export const STATEMENT_HEADERS = [
  "Date",
  "Narration",
  "Ch./Ref. no.",
  "Withdrawal",
  "Deposit",
] as const;

export function statementChartRows(rows: BankRow[]) {
  return rows.map((r) => [
    r.dateRaw || r.cells[0] || "",
    r.particular || r.cells[1] || "",
    r.ref || r.cells[2] || "",
    r.debit ? String(r.debit) : "",
    r.credit ? String(r.credit) : "",
  ]);
}

export function statementCsv(headers: string[], rows: string[][]) {
  const esc = (s: string) =>
    /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  return `\uFEFF${[headers, ...rows].map((r) => r.map(esc).join(",")).join("\n")}`;
}

export function statementChartHtml(headers: string[], rows: string[][]) {
  const esc = (s: string) =>
    String(s)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">");
  const head = headers.map((h) => `<th>${esc(h)}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("");
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

type PdfTextItem = { str: string; x: number; y: number; page: number };

const HDFC_SKIP =
  /statement summary|opening balance|closing bal|generated on|generated by|hdfc bank|page no|we understand|account branch|nomination|joint holders|statement of account|computer generated|does not require|registered office|gstin|contents of this statement|requesting branch|prime potential|cust id|account no|account status|account type|branch code|od limit|phone no|e-?mail|micr\b|ifsc|from\s*:/i;

export function bankRowsFromPdfItems(items: PdfTextItem[]): BankRow[] {
  const lines = clusterPdfLines(items);
  const parsed: Partial<BankRow>[] = [];
  for (const line of lines) {
    const cols = bucketHdfcLine(line.parts);
    const blob = cols.text;
    if (!blob || HDFC_SKIP.test(blob) || isHeaderish(blob)) continue;
    const dateRaw = cols.date.match(/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/)?.[0] ?? "";
    const date = dateRaw ? parseLooseDate(dateRaw) : "";
    if (date) {
      const debit = parseAmount(cols.wdl);
      const credit = parseAmount(cols.dep);
      parsed.push({
        date,
        dateRaw,
        particular: cols.narr,
        ref: cols.ref,
        debit,
        credit,
        amount: credit || debit,
        dc: debit && !credit ? "D" : credit ? "C" : "",
        month: date.slice(0, 7),
        headers: CLEAN_HEADERS,
        cells: [
          dateRaw,
          cols.narr,
          cols.ref,
          debit ? cols.wdl : "",
          credit ? cols.dep : "",
        ],
      });
      continue;
    }
    const last = parsed[parsed.length - 1];
    if (!last || cols.wdl || cols.dep) continue;
    if (cols.narr) last.particular = asText(`${last.particular ?? ""} ${cols.narr}`);
    if (cols.ref && !last.ref) last.ref = cols.ref;
  }
  return normalizeBankRows(parsed.map((row) => slimRow(row)));
}

function clusterPdfLines(items: PdfTextItem[]) {
  const sorted = items
    .filter((item) => asText(item.str))
    .sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
  const lines: { page: number; y: number; parts: PdfTextItem[] }[] = [];
  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (
      last &&
      last.page === item.page &&
      Math.abs(last.y - item.y) <= 1.6
    ) {
      last.parts.push(item);
    } else lines.push({ page: item.page, y: item.y, parts: [item] });
  }
  return lines;
}

function bucketHdfcLine(parts: PdfTextItem[]) {
  const bag: Record<"date" | "narr" | "ref" | "wdl" | "dep", string[]> = {
    date: [],
    narr: [],
    ref: [],
    wdl: [],
    dep: [],
  };
  for (const part of [...parts].sort((a, b) => a.x - b.x)) {
    const band = hdfcBand(part.x);
    if (band === "skip") continue;
    bag[band].push(asText(part.str));
  }
  const join = (list: string[]) => list.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const date = join(bag.date);
  const narr = join(bag.narr);
  const ref = join(bag.ref);
  const wdl = join(bag.wdl);
  const dep = join(bag.dep);
  return { date, narr, ref, wdl, dep, text: [date, narr, ref, wdl, dep].filter(Boolean).join(" ") };
}

function hdfcBand(x: number): "date" | "narr" | "ref" | "wdl" | "dep" | "skip" {
  if (x < 60) return "date";
  if (x < 250) return "narr";
  if (x < 340) return "ref";
  if (x < 395) return "skip";
  if (x < 500) return "wdl";
  if (x < 575) return "dep";
  return "skip";
}

function pdfItemsFromContent(items: unknown[], page: number): PdfTextItem[] {
  const out: PdfTextItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object" || !("str" in item)) continue;
    const str = asText((item as { str?: unknown }).str);
    if (!str) continue;
    const transform = (item as { transform?: number[] }).transform ?? [];
    out.push({
      str,
      x: transform[4] ?? 0,
      y: transform[5] ?? 0,
      page,
    });
  }
  return out;
}
async function openStatementPdf(data: ArrayBuffer, password = "") {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  try {
    return await pdfjs.getDocument({
      data,
      password: password || undefined,
    }).promise;
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

export async function bankRowsFromPdf(
  data: ArrayBuffer,
  password = "",
): Promise<BankRow[]> {
  const doc = await openStatementPdf(data, password);
  const items: PdfTextItem[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    items.push(...pdfItemsFromContent(content.items as unknown[], i));
  }
  const rows = bankRowsFromPdfItems(items);
  if (!rows.length) {
    throw new Error(
      "No journal rows in this PDF. The file needs Date, Narration, Chq/Ref, Withdrawal and Deposit.",
    );
  }
  return rows;
}

export async function statementTextFromPdf(
  data: ArrayBuffer,
  password = "",
): Promise<string> {
  const rows = await bankRowsFromPdf(data, password);
  return rows
    .map((row) =>
      [row.dateRaw, row.particular, row.ref, row.debit || "", row.credit || ""].join("\t"),
    )
    .join("\n");
}

export interface BankPdfLine {
  date: string;
  narration: string;
  ref: string;
  withdrawal: string;
  deposit: string;
  officeDate: string;
  name: string;
  reason: string;
}

export async function downloadBankStatementPdf(input: {
  title: string;
  fileName: string;
  lines: BankPdfLine[];
}) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const pageH = 210;
  const margin = 5;
  const innerW = pageW - margin * 2;
  const titleH = 8;
  const headH = 6;
  const n = Math.max(input.lines.length, 1);
  const usable = pageH - margin * 2 - titleH - headH;
  const rowH = Math.min(5.2, usable / n);
  const font = rowH >= 4.6 ? 7 : rowH >= 3.6 ? 6 : rowH >= 2.8 ? 5 : 4;
  const cols: { label: string; w: number; right?: boolean }[] = [
    { label: "Date", w: 22 },
    { label: "Narration", w: 88 },
    { label: "Ch./Ref. no.", w: 40 },
    { label: "Withdrawal", w: 26, right: true },
    { label: "Deposit", w: 26, right: true },
    { label: "Office date", w: 24 },
    { label: "Name", w: 32 },
    { label: "Reason", w: 27 },
  ];
  const scale = innerW / cols.reduce((s, c) => s + c.w, 0);
  for (const col of cols) col.w *= scale;

  pdf.setFillColor(15, 61, 42);
  pdf.rect(0, 0, pageW, titleH + margin, "F");
  pdf.setTextColor(240, 192, 64);
  pdf.setFont("times", "bold");
  pdf.setFontSize(13);
  pdf.text(input.title, margin, margin + 5.2);

  let x = margin;
  let y = margin + titleH;
  pdf.setFillColor(246, 239, 220);
  pdf.rect(margin, y, innerW, headH, "F");
  pdf.setTextColor(17, 17, 17);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(font);
  for (const col of cols) {
    const tx = col.right ? x + col.w - 1.2 : x + 1.2;
    pdf.text(col.label, tx, y + headH - 1.8, { align: col.right ? "right" : "left" });
    x += col.w;
  }
  y += headH;

  pdf.setFont("helvetica", "normal");
  const fit = (text: string, maxW: number) => {
    const raw = text || "—";
    if (pdf.getTextWidth(raw) <= maxW) return raw;
    let t = raw;
    while (t.length > 1 && pdf.getTextWidth(`${t}…`) > maxW) t = t.slice(0, -1);
    return `${t}…`;
  };

  input.lines.forEach((line, i) => {
    if (i % 2 === 0) {
      pdf.setFillColor(248, 250, 248);
      pdf.rect(margin, y, innerW, rowH, "F");
    }
    const cells = [
      line.date,
      line.narration,
      line.ref,
      line.withdrawal,
      line.deposit,
      line.officeDate,
      line.name,
      line.reason,
    ];
    x = margin;
    cols.forEach((col, idx) => {
      const tx = col.right ? x + col.w - 1.2 : x + 1.2;
      pdf.text(fit(cells[idx] || "—", col.w - 2.4), tx, y + rowH - 1.2, {
        align: col.right ? "right" : "left",
      });
      x += col.w;
    });
    y += rowH;
  });

  pdf.setDrawColor(17, 17, 17);
  pdf.rect(margin, margin + titleH, innerW, headH + rowH * input.lines.length);

  pdf.save(input.fileName);
}

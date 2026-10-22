import { addDays, format, parseISO } from "date-fns";
import type { jsPDF } from "jspdf";
import { buildDueAccounts } from "./balance";
import { reconcileBank, type BankRow } from "./bank-recon";
import {
  acServiceKind,
  acServiceLabel,
  complaintPlaceLabel,
  isAcService,
} from "./complaints";
import type { RoomComplaint } from "./complaints";
import { complaintStatus } from "./complaint-report";
import { englishNarration } from "./english-narration";
import { salaryPayMonth, salaryPayMonthKey } from "./format";
import { inventoryDifference, signedCount, type InventoryFile } from "./inventory";
import type { PayrollFile } from "./payroll-files";
import { paintPdfReportHead } from "./report-head";
import { staffPay } from "./staff-pay";
import type { AdvanceRow, GuestEntry, ModeAmount, NamedAmount, StaffRow } from "./types";

const HEAD: [number, number, number] = [27, 51, 42];
const GOLD: [number, number, number] = [244, 196, 48];
const CREAM: [number, number, number] = [243, 234, 212];
const SUB: [number, number, number] = [239, 232, 216];

export type MonthPackInput = {
  hotel: string;
  blessing: string;
  asOf: string;
  guests: GuestEntry[];
  food: ModeAmount[];
  wholesale: ModeAmount[];
  expenses: NamedAmount[];
  receipts: NamedAmount[];
  bankRows: BankRow[];
  payrollFiles: PayrollFile[];
  staff: StaffRow[];
  advances: AdvanceRow[];
  inventoryFiles: InventoryFile[];
  complaints: RoomComplaint[];
};

function money(v: number) {
  return Math.round(v).toLocaleString("en-IN");
}

function stamp(iso: string) {
  try {
    return format(parseISO(iso), "dd/MM/yy");
  } catch {
    return iso;
  }
}

function monthStart(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

function wsDay(file: { id: string; period: string; createdAt: string }) {
  const fromId = file.id.split(":").slice(2).join(":");
  const raw = `${file.period || ""} ${fromId} ${file.createdAt || ""}`;
  const hit = raw.match(/\d{4}-\d{2}-\d{2}/);
  return hit ? hit[0] : "";
}

function datesFrom(start: string, end: string) {
  const out: string[] = [];
  let cursor = start;
  while (cursor <= end && out.length < 31) {
    out.push(cursor);
    cursor = format(addDays(parseISO(cursor), 1), "yyyy-MM-dd");
  }
  return out;
}

function clip(pdf: jsPDF, text: string, width: number) {
  const line = pdf.splitTextToSize(text || "—", Math.max(3, width - 1.2))[0];
  return String(line ?? "—");
}

export async function downloadMonthPack(input: MonthPackInput, filename: string) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const start = monthStart(input.asOf);
  const end = input.asOf < start ? start : input.asOf;
  const month = input.asOf.slice(0, 7);
  const range = `${stamp(start)} – ${stamp(end)}`;
  let y = 0;
  let wide = false;

  async function sheet(landscape: boolean, right: string) {
    if (y > 0) pdf.addPage("a4", landscape ? "landscape" : "portrait");
    wide = landscape;
    pdf.setFillColor(255, 255, 255);
    const w = landscape ? 297 : 210;
    const h = landscape ? 210 : 297;
    pdf.rect(0, 0, w, h, "F");
    y = await paintPdfReportHead(pdf, {
      x: 10,
      y: 8,
      w: w - 20,
      h: 16,
      hotel: input.hotel.toUpperCase(),
      blessing: input.blessing.toUpperCase(),
      right,
    });
    y += 3;
    pdf.setFont("times", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);
    pdf.text(range, 10, y);
    y += 4;
  }

  function contentW() {
    return wide ? 277 : 190;
  }

  function bottom() {
    return wide ? 198 : 284;
  }

  async function room(need: number, title: string) {
    if (y + need <= bottom()) return;
    await sheet(wide, title);
  }

  function section(title: string) {
    pdf.setFillColor(...HEAD);
    pdf.rect(10, y, contentW(), 6.5, "F");
    pdf.setFont("times", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...GOLD);
    pdf.text(title, 12, y + 4.5);
    y += 6.5;
  }

  function grid(
    widths: number[],
    rows: string[][],
    opts?: { header?: boolean; boldLast?: boolean; rightFrom?: number; size?: number },
  ) {
    const rh = (opts?.size ?? 8) > 7 ? 6.2 : 5.2;
    const rightFrom = opts?.rightFrom ?? widths.length;
    for (let index = 0; index < rows.length; index++) {
      const cells = rows[index]!;
      const head = Boolean(opts?.header && index === 0);
      const last = Boolean(opts?.boldLast && index === rows.length - 1);
      if (head || last) {
        pdf.setFillColor(...(head ? CREAM : SUB));
        pdf.rect(10, y, contentW(), rh, "F");
      }
      pdf.setDrawColor(26, 26, 26);
      pdf.setLineWidth(0.12);
      pdf.rect(10, y, contentW(), rh, "S");
      pdf.setFont("times", head || last ? "bold" : "normal");
      pdf.setFontSize(opts?.size ?? 8);
      pdf.setTextColor(17, 17, 17);
      let x = 10;
      cells.forEach((cell, i) => {
        const w = widths[i] ?? 20;
        const num = i >= rightFrom;
        pdf.text(clip(pdf, cell, w), num ? x + w - 0.8 : x + 1, y + rh * 0.68, {
          align: num ? "right" : "left",
        });
        if (i < cells.length - 1) pdf.line(x + w, y, x + w, y + rh);
        x += w;
      });
      y += rh;
    }
  }

  await sheet(false, `MONTH  ${range}`);

  const payKey = salaryPayMonthKey(input.asOf);
  const payTitle = salaryPayMonth(input.asOf);
  const salaryFile = input.payrollFiles.find((f) => f.kind === "salary" && f.period === payKey);
  const salary = (salaryFile?.staff?.length ? salaryFile.staff : input.staff.filter((r) => r.month === payKey))
    .filter((r) => r.name.trim());
  section(`Salary of ${payTitle}`);
  const salW = [42, 28, 16, 16, 18, 18, 26, 26];
  grid(salW, [["Name", "Role", "Days", "Absent", "Work", "Extra", "Advance", "Net"]], {
    header: true,
    rightFrom: 2,
  });
  if (salary.length === 0) grid([190], [[`Salary of ${payTitle} is not saved`]]);
  let netSum = 0;
  let advSum = 0;
  for (const row of salary) {
    await room(7, `MONTH  ${range}`);
    const pay = staffPay(row.salary, row.working, row.extra ?? 0, row.advance, 30);
    netSum += pay.payable;
    advSum += row.advance;
    grid(salW, [[
      row.name.toUpperCase(),
      (row.role || "—").toUpperCase(),
      row.days || "—",
      String(row.absent || 0),
      String(row.working || 0),
      String(row.extra || 0),
      money(row.advance),
      money(pay.payable),
    ]], { rightFrom: 2 });
  }
  if (salary.length) {
    await room(7, `MONTH  ${range}`);
    grid([138, 26, 26], [["Total", money(advSum), money(netSum)]], { boldLast: true, rightFrom: 1 });
  }
  y += 3;

  const advFile = input.payrollFiles.find((f) => f.kind === "advance" && f.period === month);
  const adv = (advFile?.advances?.length ? advFile.advances : input.advances.filter((r) => r.month === month))
    .filter((r) => r.name.trim() || r.cash || r.qrs);
  await room(16, `MONTH  ${range}`);
  section("Salary advance");
  const advW = [90, 34, 36, 30];
  grid(advW, [["Name", "Cash", "Santosh QR", "Total"]], { header: true, rightFrom: 1 });
  if (adv.length === 0) grid([190], [["No advance saved for this month"]]);
  for (const row of adv) {
    await room(7, `MONTH  ${range}`);
    grid(advW, [[row.name.toUpperCase() || "—", money(row.cash), money(row.qrs), money(row.cash + row.qrs)]], {
      rightFrom: 1,
    });
  }
  if (adv.length) {
    const cash = adv.reduce((s, r) => s + r.cash, 0);
    const qr = adv.reduce((s, r) => s + r.qrs, 0);
    await room(7, `MONTH  ${range}`);
    grid(advW, [["Total", money(cash), money(qr), money(cash + qr)]], { boldLast: true, rightFrom: 1 });
  }

  const accounts = buildDueAccounts(
    input.guests.filter((g) => g.date <= end),
    input.receipts.filter((r) => r.date <= end),
  )
    .map((a) => ({
      ...a,
      stays: a.stays.filter((s) => s.remaining > 0 || (s.checkIn <= end && (s.inHouse || !s.checkOut || s.checkOut >= start))),
    }))
    .filter((a) => a.remaining > 0 || a.stays.some((s) => s.checkIn >= start && s.checkIn <= end))
    .sort((a, b) => b.remaining - a.remaining || a.key.localeCompare(b.key));

  await room(20, `BALANCE  ${range}`);
  y += 3;
  section("Balance · guest detail");
  pdf.setFont("times", "italic");
  pdf.setFontSize(8);
  pdf.setTextColor(80, 80, 80);
  pdf.text("Carried means the stay started before this month and is still on the book.", 10, y + 4);
  y += 6;

  if (accounts.length === 0) {
    grid([190], [["No open balance"]]);
  }
  const stayW = [36, 14, 20, 20, 12, 22, 22, 24, 20];
  for (const account of accounts) {
    await room(18, `BALANCE  ${range}`);
    const got = account.receipts.filter((r) => r.date >= start && r.date <= end).reduce((s, r) => s + r.amount, 0);
    grid([190], [[
      `${account.key}    Billed ${money(account.billed)}    Paid ${money(account.collected)}    Balance ${money(Math.max(0, account.remaining))}    Received now ${money(got)}`,
    ]], { header: true });
    grid(stayW, [["Guest", "Room", "From", "To", "Days", "Billed", "Paid", "Balance", "Note"]], {
      header: true,
      rightFrom: 4,
    });
    const stays = account.stays.length ? account.stays : [];
    if (stays.length === 0) grid([190], [["No stay rows"]]);
    for (const stay of stays) {
      await room(7, `BALANCE  ${range}`);
      const carried = stay.checkIn < start;
      grid(stayW, [[
        stay.name.toUpperCase(),
        stay.roomNo || "—",
        stamp(stay.checkIn),
        stay.inHouse || !stay.checkOut ? "In house" : stamp(stay.checkOut),
        String(stay.days),
        money(stay.billed),
        money(stay.paid),
        money(stay.remaining),
        carried ? "Carried" : "This month",
      ]], { rightFrom: 4 });
    }
    y += 2;
  }

  function stockFile(kind: "linen" | "kitchen") {
    return input.inventoryFiles.find((f) => f.kind === kind && f.period === month);
  }

  async function stock(kind: "linen" | "kitchen", title: string) {
    await room(18, `STOCK  ${range}`);
    y += 2;
    section(title);
    const file = stockFile(kind);
    const w = [70, 28, 28, 24, 40];
    grid(w, [["Item", "Last month", "This month", "Diff", "Notes"]], { header: true, rightFrom: 1 });
    if (!file) {
      grid([190], [["Not saved for this month"]]);
      return;
    }
    for (const row of file.lines.filter((r) => r.name.trim())) {
      await room(7, `STOCK  ${range}`);
      grid(w, [[
        row.name,
        String(row.lastMonth),
        String(row.thisMonth),
        signedCount(inventoryDifference(row)),
        row.notes || "—",
      ]], { rightFrom: 1 });
    }
  }

  await stock("linen", "Linen stock");
  await stock("kitchen", "Kitchen stock");

  const days = datesFrom(start, end);
  const wsFiles = input.inventoryFiles.filter((file) => {
    if (file.kind !== "ws") return false;
    const day = wsDay(file);
    return Boolean(day) && day >= start && day <= end;
  });
  await sheet(true, `WS STOCK  ${range}`);
  section("WS stock · one row per item, one column per day");
  const names: string[] = [];
  for (const file of [...wsFiles].sort((a, b) => wsDay(a).localeCompare(wsDay(b)))) {
    for (const line of file.lines) {
      const name = line.name.trim();
      if (name && !names.includes(name)) names.push(name);
    }
  }
  if (names.length === 0) {
    grid([277], [["No WS count saved from the 1st through this date"]], { size: 8 });
  } else {
    const nameW = 36;
    const usable = 277 - nameW;
    const base = Math.floor((usable / days.length) * 10) / 10;
    const widths = [nameW, ...days.slice(0, -1).map(() => base)];
    const used = widths.reduce((s, n) => s + n, 0);
    widths.push(Math.round((277 - used) * 10) / 10);
    const size = days.length > 24 ? 6 : 7;
    const head = ["Item", ...days.map((d) => String(Number(d.slice(8))))];
    grid(widths, [head], { header: true, rightFrom: 1, size });
    const byDay = new Map(wsFiles.map((f) => [wsDay(f), f]));
    for (const name of names) {
      if (y + 6 > bottom()) {
        await sheet(true, `WS STOCK  ${range}`);
        section("WS stock · continued");
        grid(widths, [head], { header: true, rightFrom: 1, size });
      }
      const cells = days.map((d) => {
        const file = byDay.get(d);
        if (!file) return "";
        const line = file.lines.find((r) => r.name.trim().toLowerCase() === name.toLowerCase());
        if (!line) return "";
        return String(line.thisMonth);
      });
      grid(widths, [[name, ...cells]], { rightFrom: 1, size });
    }
  }

  const bankRows = input.bankRows.filter(
    (row) => row.month === month || (row.date >= start && row.date <= end),
  );
  const bankLines = reconcileBank(bankRows, input.guests, {
    food: input.food,
    wholesale: input.wholesale,
    expenses: input.expenses,
    receipts: input.receipts,
  });
  await sheet(true, `BANK  ${range}`);
  section("Bank reconciliation");
  const bankW = [22, 78, 36, 24, 24, 22, 36, 35];
  grid(bankW, [["Date", "Narration", "Reference", "Withdrawal", "Deposit", "Office", "Name", "Reason"]], {
    header: true,
    rightFrom: 3,
    size: 7,
  });
  if (bankLines.length === 0) {
    grid([277], [["No bank statement for this month"]], { size: 8 });
  }
  for (const line of bankLines) {
    if (y + 6 > bottom()) {
      await sheet(true, `BANK  ${range}`);
      section("Bank reconciliation · continued");
      grid(bankW, [["Date", "Narration", "Reference", "Withdrawal", "Deposit", "Office", "Name", "Reason"]], {
        header: true,
        rightFrom: 3,
        size: 7,
      });
    }
    grid(bankW, [[
      line.bank.dateRaw || stamp(line.bank.date),
      englishNarration(line.bank.particular) || "—",
      line.bank.ref || "—",
      line.bank.debit ? money(line.bank.debit) : "—",
      line.bank.credit ? money(line.bank.credit) : "—",
      line.office ? stamp(line.office.date) : "—",
      line.office?.name || "—",
      line.office?.reason ? englishNarration(line.office.reason) : "—",
    ]], { rightFrom: 3, size: 7 });
  }

  const raised = input.complaints.filter(
    (c) => !isAcService(c) && c.createdAt >= start && c.createdAt <= end,
  );
  const pendingBefore = input.complaints.filter(
    (c) => !isAcService(c) && c.createdAt < start && c.level !== "green",
  );
  await sheet(false, `COMPLAINTS  ${range}`);
  section("Complaints this period");
  const compW = [22, 78, 28, 32, 30];
  grid(compW, [["Place", "Problem", "Status", "By", "Date"]], { header: true });
  if (raised.length === 0) grid([190], [["No complaint in this period"]]);
  for (const row of [...raised].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.roomNo.localeCompare(b.roomNo))) {
    await room(7, `COMPLAINTS  ${range}`);
    grid(compW, [[
      complaintPlaceLabel(row.roomNo),
      row.note || "—",
      complaintStatus(row.level),
      row.by || "—",
      stamp(row.createdAt),
    ]]);
  }
  y += 3;
  await room(16, `COMPLAINTS  ${range}`);
  section("Still pending");
  const pending = [...raised.filter((c) => c.level !== "green"), ...pendingBefore].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  grid(compW, [["Place", "Problem", "Status", "By", "Date"]], { header: true });
  if (pending.length === 0) grid([190], [["Nothing pending"]]);
  for (const row of pending) {
    await room(7, `COMPLAINTS  ${range}`);
    grid(compW, [[
      complaintPlaceLabel(row.roomNo),
      row.note || "—",
      row.createdAt < start ? `${complaintStatus(row.level)} · earlier` : complaintStatus(row.level),
      row.by || "—",
      stamp(row.createdAt),
    ]]);
  }

  const ac = input.complaints
    .filter((c) => isAcService(c) && c.createdAt >= start && c.createdAt <= end)
    .sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }) || a.createdAt.localeCompare(b.createdAt));
  y += 3;
  await room(16, `AC SERVICE  ${range}`);
  section("AC service");
  const acW = [28, 32, 80, 50];
  grid(acW, [["Room", "Date", "Service", "By"]], { header: true });
  if (ac.length === 0) grid([190], [["No AC service in this period"]]);
  for (const row of ac) {
    await room(7, `AC SERVICE  ${range}`);
    const kind = acServiceKind(row.note);
    grid(acW, [[
      complaintPlaceLabel(row.roomNo),
      stamp(row.createdAt),
      kind ? acServiceLabel(kind) : "Service",
      row.by || "—",
    ]]);
  }

  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    const h = pdf.internal.pageSize.getHeight();
    pdf.setFont("times", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(90, 90, 90);
    pdf.text(`${i} / ${pages}`, pdf.internal.pageSize.getWidth() / 2, h - 4, { align: "center" });
  }
  const name = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
  pdf.save(name);
}

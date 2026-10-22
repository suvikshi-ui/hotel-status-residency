import { format, parseISO } from "date-fns";
import type { jsPDF } from "jspdf";
import type { DayTake } from "./day-report";
import type { DayBooks, GuestEntry, NamedAmount } from "./types";
import { joinRecvTags, otaChannelLabel, otaReceivedTag } from "./ota-label";
import { englishNarration } from "./english-narration";
import { paintPdfReportHead } from "./report-head";
import { stayDates } from "./stay";

export type DailyPdfInput = {
  hotel: string;
  blessing: string;
  date: string;
  books: DayBooks | undefined;
  take: DayTake;
  expenses: NamedAmount[];
  receipts: NamedAmount[];
  guests: GuestEntry[];
};

type Tone = "ob" | "ok" | "bad" | "sub";
type Row = { label: string; sign?: string; value?: number; tone?: Tone; span?: boolean };

const GOLD: [number, number, number] = [244, 196, 48];
const GREEN: [number, number, number] = [84, 130, 53];
const RED: [number, number, number] = [192, 0, 0];
const CREAM: [number, number, number] = [243, 234, 212];
const SUB: [number, number, number] = [239, 232, 216];
const HEAD: [number, number, number] = [27, 51, 42];
const IVORY: [number, number, number] = [244, 239, 228];

function money(v: number) {
  return Math.round(v).toLocaleString("en-IN");
}

function sheetDate(iso: string) {
  try {
    return format(parseISO(iso), "dd/MM/yy");
  } catch {
    return iso;
  }
}

function isRoomNo(s: string) {
  return /^\d{1,4}[A-Z]?$/i.test(s.trim());
}

function roomsFor(
  recs: { particular: string; kind?: string | null }[],
  guests: GuestEntry[],
  date: string,
) {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string) => {
    const t = raw.trim();
    if (!isRoomNo(t)) return;
    const k = t.replace(/^0+/, "") || t;
    if (seen.has(k.toUpperCase())) return;
    seen.add(k.toUpperCase());
    out.push(t);
  };
  for (const r of recs) {
    if (r.kind === "ota" || r.kind === "list") continue;
    const p = r.particular.trim();
    if (!p) continue;
    if (isRoomNo(p)) {
      add(p);
      continue;
    }
    const key = p.toUpperCase();
    const hits = guests.filter((g) => {
      const src = (g.source ?? "").trim().toUpperCase();
      const name = g.name.trim().toUpperCase();
      return src === key || name === key;
    });
    const today = hits.filter((g) => g.date === date);
    const pool = today.length
      ? today
      : hits.length
        ? [hits.reduce((best, g) => (g.date > best.date ? g : best))]
        : [];
    for (const g of pool) add(g.roomNo);
  }
  return out.length ? ` (${out.join(",")})` : "";
}

function blocksOf(input: DailyPdfInput) {
  const c = input.books?.cashBook;
  const s = input.books?.santosh;
  const pk = input.books?.pk;
  const o = input.books?.online;
  const b = input.books?.outstanding;
  const cashRec = input.receipts.filter((r) => r.mode === "CASH");
  const qrRec = input.receipts.filter((r) => r.mode === "QRS");
  const pkRec = input.receipts.filter((r) => r.mode === "QRPK");
  const cashExp = input.expenses.filter((e) => e.mode === "CASH");
  const qrExp = input.expenses.filter((e) => e.mode === "QRS");
  const pkExp = input.expenses.filter((e) => e.mode === "QRPK");
  const rooms = input.take.balanceRooms.join(",");
  const balTag = rooms ? `BAL (${rooms})` : "BAL";
  const cashRooms = roomsFor(cashRec, input.guests, input.date);
  const qrRooms = roomsFor(qrRec, input.guests, input.date);
  const pkRooms = joinRecvTags(
    roomsFor(
      pkRec.filter((r) => r.kind !== "ota"),
      input.guests,
      input.date,
    ),
    otaReceivedTag(input.receipts),
  );
  const onRooms = otaReceivedTag(input.receipts);
  const dueRooms = roomsFor([...qrRec, ...cashRec, ...pkRec], input.guests, input.date);
  const santoshSub =
    (s?.ob ?? 0) + (s?.salesQr ?? 0) + (s?.foodQr ?? 0) + (s?.other ?? 0);
  const pkSub =
    (pk?.ob ?? 0) + (pk?.salesQr ?? 0) + (pk?.foodQr ?? 0) + (pk?.other ?? 0);
  const dueAfterRecv = (b?.ob ?? 0) - (b?.balReceived ?? 0);

  const left: { title: string; rows: Row[] }[] = [
    {
      title: "CASH BALANCE",
      rows: [
        { label: "O/B", value: c?.ob ?? 0, tone: "ob" },
        { label: "SALES", sign: "+", value: c?.sales ?? 0 },
        { label: "FOOD", sign: "+", value: c?.food ?? 0 },
        { label: "WS", sign: "+", value: c?.ws ?? 0 },
        { label: `BAL RECEI${cashRooms}`, sign: "+", value: c?.balReceived ?? 0 },
        { label: "TOTAL", value: c?.gross ?? 0, tone: "sub" },
        { label: "EXP", sign: "−", value: c?.exp ?? 0 },
        { label: "QR", sign: "−", value: c?.qr ?? 0 },
        { label: "P.K. QR", sign: "−", value: c?.pk ?? 0 },
        { label: "ONLINE", sign: "−", value: c?.online ?? 0 },
        { label: balTag, sign: "−", value: c?.balance ?? 0 },
        { label: "TOTAL", value: c?.cb ?? 0, tone: "ok" },
      ],
    },
    {
      title: "EXPENSES",
      rows: [
        ...cashExp.map((e) => ({
          label: englishNarration(e.particular).toUpperCase(),
          value: e.amount,
        })),
        {
          label: "TOTAL",
          value: cashExp.reduce((sum, e) => sum + e.amount, 0),
          tone: "bad" as const,
        },
      ],
    },
    {
      title: "BALANCE AMOUNT",
      rows: [
        { label: "O/B", value: b?.ob ?? 0, tone: "ob" },
        { label: `BAL RECEI${dueRooms}`, sign: "−", value: b?.balReceived ?? 0 },
        { label: "TOTAL", value: dueAfterRecv, tone: "sub" },
        { label: balTag, sign: "+", value: b?.sales ?? 0 },
        { label: "TOTAL", value: b?.cb ?? 0, tone: "ok" },
        { label: rooms ? `BAL (${rooms})` : "", span: true },
      ],
    },
  ];

  const qrRows = (book: typeof s, exp: NamedAmount[], recvLabel: string, recv: number, sub: number) => {
    const expRows = exp.length
      ? exp.map((e) => ({
          label: englishNarration(e.particular).toUpperCase(),
          sign: "−",
          value: e.amount,
        }))
      : [{ label: "EXP", sign: "−", value: book?.exp ?? 0 }];
    return [
      { label: "O/B", value: book?.ob ?? 0, tone: "ob" as const },
      { label: "SALES", sign: "+", value: book?.salesQr ?? 0 },
      { label: "FOOD / WS", sign: "+", value: book?.foodQr ?? 0 },
      { label: recvLabel, sign: "+", value: recv },
      { label: "TOTAL", value: sub, tone: "sub" as const },
      ...expRows,
      { label: "TOTAL", value: book?.cb ?? 0, tone: "ok" as const },
    ];
  };

  const right: { title: string; rows: Row[] }[] = [
    {
      title: "SANTOSH QR",
      rows: qrRows(s, qrExp, `BAL RECEI${qrRooms}`, s?.other ?? 0, santoshSub),
    },
    {
      title: "P.K QR",
      rows: qrRows(pk, pkExp, `BAL RECEI${pkRooms}`, pk?.other ?? 0, pkSub),
    },
    {
      title: "ONLINE",
      rows: [
        { label: "O/B", value: o?.ob ?? 0, tone: "ob" },
        { label: "SALES", sign: "+", value: o?.sales ?? 0 },
        { label: `BAL RECEI${onRooms}`, sign: "−", value: o?.balReceived ?? 0 },
        { label: "TOTAL", value: o?.cb ?? 0, tone: "ok" },
      ],
    },
  ];

  return { left, right };
}

function toneFill(pdf: jsPDF, tone?: Tone) {
  if (tone === "ob") pdf.setFillColor(...GOLD);
  else if (tone === "ok") pdf.setFillColor(...GREEN);
  else if (tone === "bad") pdf.setFillColor(...RED);
  else if (tone === "sub") pdf.setFillColor(...SUB);
  else pdf.setFillColor(255, 255, 255);
}

function drawTable(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  title: string,
  rows: Row[],
  maxY: number,
) {
  const rh = Math.min(7.1, Math.max(5.4, (maxY - y - 8) / (rows.length + 1)));
  const signW = 9;
  const valW = 26;
  const labW = w - signW - valW;
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.28);
  pdf.setFillColor(...CREAM);
  pdf.rect(x, y, w, rh, "FD");
  pdf.setTextColor(17, 17, 17);
  pdf.setFont("times", "bold");
  pdf.setFontSize(10);
  pdf.text(title, x + w / 2, y + rh * 0.68, { align: "center" });
  y += rh;
  for (const row of rows) {
    if (row.span) {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, w, rh, "FD");
      pdf.setTextColor(17, 17, 17);
      pdf.setFont("times", "bold");
      pdf.setFontSize(8.5);
      if (row.label) pdf.text(row.label, x + 2, y + rh * 0.68, { maxWidth: w - 4 });
      y += rh;
      continue;
    }
    const labelFill = row.tone === "sub" ? SUB : [255, 255, 255];
    pdf.setFillColor(labelFill[0], labelFill[1], labelFill[2]);
    pdf.rect(x, y, labW, rh, "FD");
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x + labW, y, signW, rh, "FD");
    toneFill(pdf, row.tone);
    pdf.rect(x + labW + signW, y, valW, rh, "FD");
    pdf.setTextColor(17, 17, 17);
    pdf.setFont("times", "bold");
    pdf.setFontSize(8.5);
    pdf.text(row.label, x + 2, y + rh * 0.68, { maxWidth: labW - 3 });
    pdf.setFont("times", "bold");
    pdf.text(row.sign ?? "", x + labW + signW / 2, y + rh * 0.68, { align: "center" });
    const white = row.tone === "ok" || row.tone === "bad";
    pdf.setTextColor(white ? 255 : 17, white ? 255 : 17, white ? 255 : 17);
    pdf.text(money(row.value ?? 0), x + w - 2, y + rh * 0.68, { align: "right" });
    y += rh;
  }
  return y;
}

export async function buildDailyPdf(input: DailyPdfInput): Promise<jsPDF> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const m = 8;
  const x0 = m;
  const y0 = m;
  const W = 210 - m * 2;
  const H = 297 - m * 2;
  const { left, right } = blocksOf(input);

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 210, 297, "F");
  pdf.setFillColor(...IVORY);
  pdf.roundedRect(x0, y0, W, H, 3.2, 3.2, "F");

  const headH = 20;
  await paintPdfReportHead(pdf, {
    x: x0,
    y: y0,
    w: W,
    h: headH,
    hotel: input.hotel.toUpperCase(),
    blessing: input.blessing.toUpperCase(),
    right: `DATE : ${sheetDate(input.date)}`,
  });

  const gap = 1.2;
  const colW = (W - gap) / 2;
  const leftX = x0;
  const rightX = x0 + colW + gap;
  const bodyTop = y0 + headH;
  const bodyBot = y0 + H;
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.45);
  pdf.line(x0 + colW, bodyTop, x0 + colW, bodyBot);

  const pad = 2.2;
  let ly = bodyTop + pad;
  for (let i = 0; i < left.length; i++) {
    ly = drawTable(
      pdf,
      leftX + pad,
      ly,
      colW - pad * 2,
      left[i].title,
      left[i].rows,
      bodyBot - 3,
    );
    ly += 2.4;
    if (i < left.length - 1) {
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.line(leftX, ly, leftX + colW, ly);
      ly += 2.2;
    }
  }

  let ry = bodyTop + pad;
  for (let i = 0; i < right.length; i++) {
    ry = drawTable(
      pdf,
      rightX + pad,
      ry,
      colW - pad * 2,
      right[i].title,
      right[i].rows,
      bodyBot - 3,
    );
    ry += 2.4;
    if (i < right.length - 1) {
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.line(rightX, ry, rightX + colW, ry);
      ry += 2.2;
    }
  }

  pdf.setDrawColor(0);
  pdf.setLineWidth(0.7);
  pdf.roundedRect(x0, y0, W, H, 3.2, 3.2, "S");
  return pdf;
}

export async function dailyPdfBlob(input: DailyPdfInput): Promise<Blob> {
  const pdf = await buildDailyPdf(input);
  return pdf.output("blob");
}

export async function jpegFromPdfBlob(pdfBlob: Blob): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const data = new Uint8Array(await pdfBlob.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const scale = 1588 / base.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("jpeg canvas missing");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas.toDataURL("image/jpeg", 0.92);
}

function download(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function printDailyPdf(input: DailyPdfInput) {
  const blob = await dailyPdfBlob(input);
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  iframe.src = url;
  document.body.appendChild(iframe);
  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    setTimeout(() => resolve(), 2500);
  });
  try {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  } catch {
    window.open(url, "_blank", "noopener");
  }
  setTimeout(() => {
    iframe.remove();
    URL.revokeObjectURL(url);
  }, 60_000);
}

export async function saveDailyJpeg(input: DailyPdfInput, filename: string) {
  const blob = await dailyPdfBlob(input);
  const jpeg = await jpegFromPdfBlob(blob);
  download(jpeg, filename.toLowerCase().endsWith(".jpg") ? filename : `${filename}.jpg`);
}

export type DayPackBalance = {
  source: string;
  rooms: string;
  billed: number;
  paid: number;
  balance: number;
};

const PACK_M = 10;
const PACK_BOTTOM = 284;

function packClip(pdf: jsPDF, text: string, width: number) {
  const line = pdf.splitTextToSize(text || "—", Math.max(4, width - 1.4))[0];
  return String(line ?? "—");
}

function modeName(mode: string) {
  if (mode === "QRS") return "Santosh QR";
  if (mode === "QRPK") return "P.K. QR";
  if (mode === "ONLINE") return "Online";
  if (mode === "BALANCE") return "Balance";
  return "Cash";
}

async function packPage(
  pdf: jsPDF,
  hotel: string,
  blessing: string,
  right: string,
) {
  pdf.addPage();
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 210, 297, "F");
  const y = await paintPdfReportHead(pdf, {
    x: PACK_M,
    y: PACK_M,
    w: 190,
    h: 18,
    hotel: hotel.toUpperCase(),
    blessing: blessing.toUpperCase(),
    right,
  });
  return y + 4;
}

function packSection(pdf: jsPDF, y: number, title: string) {
  pdf.setFillColor(...HEAD);
  pdf.rect(PACK_M, y, 190, 7, "F");
  pdf.setFont("times", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...GOLD);
  pdf.text(title, PACK_M + 2, y + 4.8);
  return y + 7;
}

function packGrid(
  pdf: jsPDF,
  y: number,
  widths: number[],
  rows: string[][],
  opts?: { header?: boolean; boldLast?: boolean; rightFrom?: number },
) {
  const rh = 6.4;
  const rightFrom = opts?.rightFrom ?? widths.length;
  rows.forEach((cells, index) => {
    const head = Boolean(opts?.header && index === 0);
    const last = Boolean(opts?.boldLast && index === rows.length - 1);
    let x = PACK_M;
    if (head || last) {
      pdf.setFillColor(...(head ? CREAM : SUB));
      pdf.rect(PACK_M, y, 190, rh, "F");
    }
    pdf.setDrawColor(26, 26, 26);
    pdf.setLineWidth(0.15);
    pdf.rect(PACK_M, y, 190, rh, "S");
    pdf.setFont("times", head || last ? "bold" : "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(17, 17, 17);
    cells.forEach((cell, i) => {
      const w = widths[i] ?? 20;
      const num = i >= rightFrom;
      pdf.text(packClip(pdf, cell, w), num ? x + w - 1.2 : x + 1.2, y + 4.3, {
        align: num ? "right" : "left",
      });
      if (i < cells.length - 1) pdf.line(x + w, y, x + w, y + rh);
      x += w;
    });
    y += rh;
  });
  return y;
}

export async function downloadDayPack(
  input: DailyPdfInput & {
    food: { mode: string; amount: number }[];
    ws: { mode: string; amount: number }[];
    openBalance: DayPackBalance[];
  },
  filename: string,
) {
  const pdf = await buildDailyPdf(input);
  const dayGuests = input.guests
    .filter((g) => g.date === input.date)
    .sort((a, b) => a.slNo - b.slNo);
  const dayReceipts = input.receipts.filter((r) => r.kind !== "list");
  const due = dayReceipts.filter((r) => r.kind !== "ota");
  const ota = dayReceipts.filter((r) => r.kind === "ota");
  let y = await packPage(
    pdf,
    input.hotel,
    input.blessing,
    `DETAILED  ${sheetDate(input.date)}`,
  );

  async function room(need: number) {
    if (y + need <= PACK_BOTTOM) return;
    y = await packPage(pdf, input.hotel, input.blessing, `DETAILED  ${sheetDate(input.date)}`);
  }

  await room(16);
  y = packSection(pdf, y, "Guest register");
  const guestW = [8, 46, 14, 24, 20, 26, 26, 26];
  const guestHead = ["#", "Name", "Room", "Mode", "Amount", "Check-in", "Check-out", "Source"];
  await room(8);
  y = packGrid(pdf, y, guestW, [guestHead], { header: true });
  if (dayGuests.length === 0) {
    await room(7);
    y = packGrid(pdf, y, [190], [["No posting"]]);
  }
  for (const g of dayGuests) {
    await room(7);
    const stay = stayDates(input.guests, g);
    const tag =
      g.otaChannel === "FAB" ? "FAB" : g.otaChannel === "BRAVE" ? "BraveStay" : g.ota ? "OTA" : "";
    y = packGrid(pdf, y, guestW, [[
      String(g.slNo || ""),
      `${g.name.toUpperCase()}${tag ? ` · ${tag}` : ""}`,
      g.roomNo || "—",
      modeName(g.mode),
      money(g.amount),
      stay.checkIn ? sheetDate(stay.checkIn) : "—",
      stay.checkOut ? sheetDate(stay.checkOut) : "In house",
      (g.source || "—").toUpperCase(),
    ]], { rightFrom: 4 });
  }
  await room(8);
  y = packGrid(pdf, y, [160, 30], [["Posting total", money(input.take.roomsTotal)]], {
    boldLast: true,
    rightFrom: 1,
  });
  y += 3;

  async function lines(title: string, rows: { mode: string; amount: number }[]) {
    await room(14);
    y = packSection(pdf, y, title);
    if (rows.length === 0) {
      y = packGrid(pdf, y, [190], [["—"]]);
      y += 3;
      return;
    }
    for (const row of rows) {
      await room(7);
      y = packGrid(pdf, y, [160, 30], [[modeName(row.mode), money(row.amount)]], { rightFrom: 1 });
    }
    const sum = rows.reduce((s, row) => s + row.amount, 0);
    await room(7);
    y = packGrid(pdf, y, [160, 30], [["Total", money(sum)]], { boldLast: true, rightFrom: 1 });
    y += 3;
  }

  await lines("Food", input.food);
  await lines("WS", input.ws);

  await room(14);
  y = packSection(pdf, y, "Expenses");
  if (input.expenses.length === 0) {
    y = packGrid(pdf, y, [190], [["—"]]);
  } else {
    for (const e of input.expenses) {
      await room(7);
      y = packGrid(pdf, y, [130, 30, 30], [[
        englishNarration(e.particular).toUpperCase(),
        modeName(e.mode),
        money(e.amount),
      ]], { rightFrom: 2 });
    }
    await room(7);
    y = packGrid(
      pdf,
      y,
      [160, 30],
      [["Total", money(input.expenses.reduce((s, e) => s + e.amount, 0))]],
      { boldLast: true, rightFrom: 1 },
    );
  }
  y += 3;

  await room(14);
  y = packSection(pdf, y, "Balance received");
  const recvRows = due.length
    ? due.map((r) => [packRoom(r, input.guests, input.date), modeName(r.mode), money(r.amount)])
    : [["—", "", ""]];
  for (const row of recvRows) {
    await room(7);
    y = packGrid(pdf, y, [100, 50, 40], [row], { rightFrom: 2 });
  }
  y += 3;

  await room(14);
  y = packSection(pdf, y, "Fab / BraveStay");
  const otaRows = ota.length
    ? ota.map((r) => [otaChannelLabel(r.particular), modeName(r.mode), money(r.amount)])
    : [["—", "", ""]];
  for (const row of otaRows) {
    await room(7);
    y = packGrid(pdf, y, [100, 50, 40], [row], { rightFrom: 2 });
  }
  y += 3;

  const bucket = (mode: string, part: "rooms" | "food" | "ws") => {
    const book =
      mode === "CASH"
        ? input.take.cash
        : mode === "QRS"
          ? input.take.santosh
          : mode === "QRPK"
            ? input.take.pk
            : input.take.online;
    return book[part];
  };
  const recv = (mode: string, rows: NamedAmount[]) =>
    rows.filter((r) => r.mode === mode).reduce((s, r) => s + r.amount, 0);
  const payLines: string[][] = [
    ["Particular", "Cash", "Santosh QR", "P.K. QR", "Online", "Total"],
    ["Room sale", money(bucket("CASH", "rooms")), money(bucket("QRS", "rooms")), money(bucket("QRPK", "rooms")), money(bucket("ONLINE", "rooms")), money(input.take.roomsTotal)],
    ["Food", money(bucket("CASH", "food")), money(bucket("QRS", "food")), money(bucket("QRPK", "food")), money(bucket("ONLINE", "food")), money(input.take.foodTotal)],
    ["WS", money(bucket("CASH", "ws")), money(bucket("QRS", "ws")), money(bucket("QRPK", "ws")), money(bucket("ONLINE", "ws")), money(input.take.wsTotal)],
    [
      "Balance received",
      money(recv("CASH", due)),
      money(recv("QRS", due)),
      money(recv("QRPK", due)),
      money(recv("ONLINE", due)),
      money(due.reduce((s, r) => s + r.amount, 0)),
    ],
  ];
  const otaNames = [...new Set(ota.map((r) => otaChannelLabel(r.particular)))];
  for (const name of otaNames) {
    const rows = ota.filter((r) => otaChannelLabel(r.particular) === name);
    payLines.push([
      name,
      money(recv("CASH", rows)),
      money(recv("QRS", rows)),
      money(recv("QRPK", rows)),
      money(recv("ONLINE", rows)),
      money(rows.reduce((s, r) => s + r.amount, 0)),
    ]);
  }
  const modes = ["CASH", "QRS", "QRPK", "ONLINE"] as const;
  const col = (mode: (typeof modes)[number]) =>
    bucket(mode, "rooms") +
    bucket(mode, "food") +
    bucket(mode, "ws") +
    recv(mode, dayReceipts);
  const allIn = modes.reduce((s, mode) => s + col(mode), 0);
  payLines.push(["Total", money(col("CASH")), money(col("QRS")), money(col("QRPK")), money(col("ONLINE")), money(allIn)]);

  await room(16);
  y = packSection(pdf, y, "Payment in");
  const payW = [40, 30, 30, 30, 30, 30];
  for (let i = 0; i < payLines.length; i++) {
    await room(7);
    y = packGrid(pdf, y, payW, [payLines[i]], {
      header: i === 0,
      boldLast: i === payLines.length - 1,
      rightFrom: 1,
    });
  }

  y = await packPage(pdf, input.hotel, input.blessing, `BALANCE  ${sheetDate(input.date)}`);
  y = packSection(pdf, y, "Open source balance");
  const balW = [52, 38, 33, 33, 34];
  y = packGrid(pdf, y, balW, [["Source", "Rooms", "Billed", "Paid", "Balance"]], { header: true, rightFrom: 2 });
  const accounts = input.openBalance;
  if (accounts.length === 0) {
    y = packGrid(pdf, y, [190], [["No open balance"]]);
  }
  for (const a of accounts) {
    if (y + 7 > PACK_BOTTOM) {
      y = await packPage(pdf, input.hotel, input.blessing, `BALANCE  ${sheetDate(input.date)}`);
      y = packSection(pdf, y, "Open source balance");
      y = packGrid(pdf, y, balW, [["Source", "Rooms", "Billed", "Paid", "Balance"]], { header: true, rightFrom: 2 });
    }
    y = packGrid(pdf, y, balW, [[
      a.source.toUpperCase(),
      a.rooms || "—",
      money(a.billed),
      money(a.paid),
      money(a.balance),
    ]], { rightFrom: 2 });
  }
  const billed = accounts.reduce((s, a) => s + a.billed, 0);
  const paid = accounts.reduce((s, a) => s + a.paid, 0);
  const left = accounts.reduce((s, a) => s + a.balance, 0);
  if (y + 7 > PACK_BOTTOM) {
    y = await packPage(pdf, input.hotel, input.blessing, `BALANCE  ${sheetDate(input.date)}`);
  }
  y = packGrid(pdf, y, [90, 33, 33, 34], [["Total", money(billed), money(paid), money(left)]], {
    boldLast: true,
    rightFrom: 1,
  });
  y += 4;
  if (y + 20 > PACK_BOTTOM) {
    y = await packPage(pdf, input.hotel, input.blessing, `BALANCE  ${sheetDate(input.date)}`);
  }
  y = packSection(pdf, y, "Received this day");
  y = packGrid(pdf, y, [80, 55, 55], [["Room", "Mode", "Amount"]], { header: true, rightFrom: 2 });
  const today = dayReceipts.length
    ? dayReceipts.map((r) => [
        r.kind === "ota" ? otaChannelLabel(r.particular) : packRoom(r, input.guests, input.date),
        modeName(r.mode),
        money(r.amount),
      ])
    : [["—", "", ""]];
  for (const row of today) {
    if (y + 7 > PACK_BOTTOM) {
      y = await packPage(pdf, input.hotel, input.blessing, `BALANCE  ${sheetDate(input.date)}`);
    }
    y = packGrid(pdf, y, [80, 55, 55], [row], { rightFrom: 2 });
  }

  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFont("times", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(90, 90, 90);
    pdf.text(`${i} / ${pages}`, 105, 293, { align: "center" });
  }
  const name = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
  pdf.save(name);
}

function packRoom(
  rec: { particular: string },
  guests: GuestEntry[],
  date: string,
) {
  const raw = rec.particular.trim();
  if (!raw) return "—";
  if (/^\d{1,4}[A-Z]?$/i.test(raw)) return raw;
  const key = raw.toUpperCase();
  const hits = guests.filter((g) => {
    const src = (g.source ?? "").trim().toUpperCase();
    const name = g.name.trim().toUpperCase();
    return src === key || name === key;
  });
  const today = hits.filter((g) => g.date === date);
  const pool = today.length
    ? today
    : hits.length
      ? [hits.reduce((best, g) => (g.date > best.date ? g : best))]
      : [];
  const rooms = [...new Set(pool.map((g) => g.roomNo.trim()).filter(Boolean))];
  return rooms.length ? rooms.join(", ") : "—";
}

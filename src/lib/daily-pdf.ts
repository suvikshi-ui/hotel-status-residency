import { format, parseISO } from "date-fns";
import type { jsPDF } from "jspdf";
import type { DayTake } from "./day-report";
import { publicUrl } from "./public-url";
import type { DayBooks, GuestEntry, NamedAmount } from "./types";

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
const HEAD: [number, number, number] = [20, 53, 44];
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

function roomsFor(recs: { particular: string }[], guests: GuestEntry[]) {
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
    const p = r.particular.trim();
    if (!p) continue;
    if (isRoomNo(p)) add(p);
    const key = p.toUpperCase();
    for (const g of guests) {
      const src = (g.source ?? "").trim().toUpperCase();
      const name = g.name.trim().toUpperCase();
      if (src === key || name === key) add(g.roomNo);
    }
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
  const onRec = input.receipts.filter((r) => r.mode === "ONLINE");
  const cashExp = input.expenses.filter((e) => e.mode === "CASH");
  const qrExp = input.expenses.filter((e) => e.mode === "QRS");
  const pkExp = input.expenses.filter((e) => e.mode === "QRPK");
  const rooms = input.take.balanceRooms.join(",");
  const balTag = rooms ? `BAL (${rooms})` : "BAL";
  const cashRooms = roomsFor(cashRec, input.guests);
  const qrRooms = roomsFor(qrRec, input.guests);
  const pkRooms = roomsFor(pkRec, input.guests);
  const onRooms = roomsFor(onRec, input.guests);
  const dueRooms = roomsFor([...qrRec, ...cashRec, ...pkRec], input.guests);
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
        { label: "ONLINE", sign: "−", value: c?.online ?? 0 },
        { label: balTag, sign: "−", value: c?.balance ?? 0 },
        { label: "TOTAL", value: c?.cb ?? 0, tone: "ok" },
      ],
    },
    {
      title: "EXPENSES",
      rows: [
        ...cashExp.map((e) => ({
          label: e.particular.toUpperCase(),
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
          label: e.particular.toUpperCase(),
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

async function logoDataUrl() {
  try {
    const res = await fetch(publicUrl("logo.png?v=2"));
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
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
  pdf.setFillColor(...HEAD);
  pdf.rect(x0, y0, W, headH, "F");

  const logo = await logoDataUrl();
  if (logo) {
    try {
      pdf.addImage(logo, "PNG", x0 + 3, y0 + 2.5, 14, 15);
    } catch {
      /* skip logo */
    }
  }

  pdf.setTextColor(...GOLD);
  pdf.setFont("times", "bold");
  pdf.setFontSize(16);
  pdf.text(input.hotel.toUpperCase(), x0 + W / 2, y0 + 9, { align: "center" });
  pdf.setTextColor(...IVORY);
  pdf.setFontSize(9);
  pdf.text(input.blessing.toUpperCase(), x0 + W / 2, y0 + 15.5, { align: "center" });
  pdf.setFontSize(9);
  pdf.text(`DATE : ${sheetDate(input.date)}`, x0 + W - 4, y0 + 12, { align: "right" });

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

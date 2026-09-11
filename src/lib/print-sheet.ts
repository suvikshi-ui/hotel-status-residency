import { publicUrl } from "@/lib/public-url";

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

function openPrintFrame(title: string, html: string, waitFonts = false) {
  const iframe = document.createElement("iframe");
  iframe.title = title;
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const run = () => {
    try {
      win.focus();
      win.print();
    } catch {
      window.print();
    }
    setTimeout(() => iframe.remove(), 2000);
  };

  const go = () => {
    if (waitFonts && doc.fonts?.ready) {
      doc.fonts.ready.then(() => setTimeout(run, 80)).catch(() => setTimeout(run, 80));
      return;
    }
    setTimeout(run, 50);
  };

  if (doc.readyState === "complete") go();
  else iframe.onload = go;
}

export function printDocument({
  title,
  heading,
  sub,
  table,
}: {
  title: string;
  heading: string;
  sub: string;
  table: string;
}) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { margin: 0; color: #1c1915; font: 13px/1.45 Georgia, "Times New Roman", serif; }
    .brand { display: flex; align-items: center; gap: 12px; margin: 0 0 12px; }
    .brand img { height: 56px; width: auto; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    .sub { margin: 0 0 16px; color: #6f675c; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 7px 8px; border-bottom: 1px solid #ddd4c2; text-align: left; }
    th { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #6f675c; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    tfoot td { font-weight: 700; border-top: 2px solid #1c1915; }
  </style>
</head>
<body>
  <div class="brand">
    <img src="${publicUrl("logo.png?v=2")}" alt="" />
    <div>
      <h1>${escapeHtml(heading)}</h1>
      <p class="sub" style="margin:0">${escapeHtml(sub)}</p>
    </div>
  </div>
  ${table}
</body>
</html>`;
  openPrintFrame(title, html);
}

export const A4_PX = { width: 794, height: 1123, marginMm: 8 };

export const CINZEL_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@600;700&display=swap";

export const A4_PRINT_CSS = `@page { size: A4 portrait; margin: 8mm; background: #fff; }
html, body { margin: 0; background: #fff !important; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
.daily-a4 {
  background: #fff !important;
  width: 100%;
  height: 100%;
  min-height: 0 !important;
  border-radius: 16px;
}
.daily-a4-head { background: #14352c !important; color: #f4efe4 !important; }
.day-chart { background: #f7f1e6 !important; }`;

export function a4PrintDocument(title: string, inner: string) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${CINZEL_FONT_HREF}" />
  <style>${A4_PRINT_CSS}</style>
</head>
<body>${inner}</body>
</html>`;
}

export function printHtmlDocument(title: string, inner: string) {
  openPrintFrame(title, a4PrintDocument(title, inner), true);
}

type PrintLine = {
  label: string;
  extra?: string;
  amount: number;
};

function moneyPlain(n: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(n ?? 0));
}

function lineRows(rows: PrintLine[], cols = 3) {
  if (!rows.length) {
    return `<tr><td colspan="${cols}" class="empty">—</td></tr>`;
  }
  return rows
    .map(
      (r) =>
        `<tr>
          <td>${escapeHtml(r.label)}</td>
          <td>${escapeHtml(r.extra ?? "")}</td>
          <td class="num">${moneyPlain(r.amount)}</td>
        </tr>`,
    )
    .join("");
}

export type ModeBook = {
  title: string;
  rooms: number;
  food: number;
  ws: number;
  recv: number;
  lines: PrintLine[];
};

function modeBlock(book: ModeBook) {
  const total = book.rooms + book.food + book.ws + book.recv;
  return `<div class="book">
    <h2>${escapeHtml(book.title)}</h2>
    <table>
      <tbody>
        <tr><td>Room sales</td><td class="num">${moneyPlain(book.rooms)}</td></tr>
        <tr><td>Food sales</td><td class="num">${moneyPlain(book.food)}</td></tr>
        <tr><td>WS</td><td class="num">${moneyPlain(book.ws)}</td></tr>
        <tr><td>Balance received</td><td class="num">${moneyPlain(book.recv)}</td></tr>
      </tbody>
      <tfoot>
        <tr><td>Total in</td><td class="num">${moneyPlain(total)}</td></tr>
      </tfoot>
    </table>
    <table>
      <thead><tr><th>List</th><th></th><th class="num">Amount</th></tr></thead>
      <tbody>${lineRows(book.lines)}</tbody>
    </table>
  </div>`;
}

export function printDailyRegister(input: {
  hotel: string;
  place: string;
  dateLabel: string;
  guests: {
    slNo: number;
    name: string;
    roomNo: string;
    mode: string;
    amount: number;
    source: string;
  }[];
  food: PrintLine[];
  ws: PrintLine[];
  expenses: PrintLine[];
  receipts: PrintLine[];
  cash: ModeBook;
  qrs: ModeBook;
  pk: ModeBook;
}) {
  const guestRows = input.guests
    .map(
      (g) => `<tr>
        <td class="num">${g.slNo}</td>
        <td>${escapeHtml(g.name)}</td>
        <td>${escapeHtml(g.roomNo)}</td>
        <td>${escapeHtml(g.mode)}</td>
        <td>${escapeHtml(g.source)}</td>
        <td class="num">${moneyPlain(g.amount)}</td>
      </tr>`,
    )
    .join("");
  const guestTotal = input.guests.reduce((s, g) => s + g.amount, 0);
  const foodTotal = input.food.reduce((s, r) => s + r.amount, 0);
  const wsTotal = input.ws.reduce((s, r) => s + r.amount, 0);
  const recTotal = input.receipts.reduce((s, r) => s + r.amount, 0);

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Daily report ${escapeHtml(input.dateLabel)}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm; }
    html, body { margin: 0; background: #fff; color: #111; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    .sheet {
      width: 194mm;
      min-height: 277mm;
      border: 2px solid #1a1a1a;
      display: flex;
      flex-direction: column;
      font: 10px/1.3 Georgia, "Times New Roman", serif;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      background: #000;
      color: #fff;
    }
    .head img { height: 42px; width: auto; }
    .head h1 { margin: 0; font-size: 16px; letter-spacing: .08em; }
    .head p { margin: 2px 0 0; font-size: 10px; }
    .body { flex: 1; padding: 6px 8px 8px; }
    h2 { margin: 7px 0 3px; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; border-bottom: 1px solid #1a1a1a; padding-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #1a1a1a; padding: 3px 5px; vertical-align: top; }
    th { background: #fff; font-size: 9px; letter-spacing: .06em; text-transform: uppercase; text-align: left; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .empty { color: #666; text-align: center; }
    tfoot td { font-weight: 700; background: #fff; }
    .triple { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
    .book { border: 1px solid #1a1a1a; padding: 4px; }
    .book h2 { margin: 0 0 4px; }
    .book table + table { margin-top: 4px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <img src="${publicUrl("logo.png?v=2")}" alt="" />
      <div>
        <h1>${escapeHtml(input.hotel.toUpperCase())}</h1>
        <p>Daily report · ${escapeHtml(input.dateLabel)} · ${escapeHtml(input.place)}</p>
      </div>
    </div>
    <div class="body">
      <h2>Daily register</h2>
      <table>
        <thead>
          <tr>
            <th>#</th><th>Name</th><th>Room</th><th>Mode</th><th>Source</th><th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${guestRows || `<tr><td colspan="6" class="empty">No guests</td></tr>`}
        </tbody>
        <tfoot>
          <tr><td colspan="5">Room sales · ${input.guests.length} guests</td><td class="num">${moneyPlain(guestTotal)}</td></tr>
        </tfoot>
      </table>

      <div class="triple" style="margin-top:8px">
        <div>
          <h2>Food</h2>
          <table>
            <thead><tr><th>Mode</th><th></th><th class="num">Amount</th></tr></thead>
            <tbody>${lineRows(input.food)}</tbody>
            <tfoot><tr><td colspan="2">Food sales</td><td class="num">${moneyPlain(foodTotal)}</td></tr></tfoot>
          </table>
        </div>
        <div>
          <h2>WS</h2>
          <table>
            <thead><tr><th>Mode</th><th></th><th class="num">Amount</th></tr></thead>
            <tbody>${lineRows(input.ws)}</tbody>
            <tfoot><tr><td colspan="2">WS sales</td><td class="num">${moneyPlain(wsTotal)}</td></tr></tfoot>
          </table>
        </div>
        <div>
          <h2>Balance received</h2>
          <table>
            <thead><tr><th>Source</th><th>Mode</th><th class="num">Amount</th></tr></thead>
            <tbody>${lineRows(input.receipts)}</tbody>
            <tfoot><tr><td colspan="2">Received</td><td class="num">${moneyPlain(recTotal)}</td></tr></tfoot>
          </table>
        </div>
      </div>

      <h2>Mode books</h2>
      <div class="triple">
        ${modeBlock(input.cash)}
        ${modeBlock(input.qrs)}
        ${modeBlock(input.pk)}
      </div>
    </div>
  </div>
</body>
</html>`;
  openPrintFrame("Daily report", html, true);
}



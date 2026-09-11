import { format, isValid, parseISO } from "date-fns";
import type { DueAccount, DueStay } from "./balance";
import { escapeHtml } from "./print-sheet";
import { publicUrl } from "./public-url";
import { HOTEL_CLOCK, stayStamp } from "./format";

function sheetDate(iso: string) {
  try {
    const d = parseISO(iso);
    return isValid(d) ? format(d, "dd/MM/yy") : iso;
  } catch {
    return iso;
  }
}

function inr(n: number) {
  return Math.round(n).toLocaleString("en-IN");
}

function checkoutLabel(stay: DueStay) {
  if (stay.checkOut) return stayStamp(stay.checkOut);
  return "Continue";
}

function statusCell(stay: DueStay) {
  if (stay.status === "paid") return "✓ Paid";
  if (stay.status === "partial") return `Partial · ${inr(stay.remaining)}`;
  return "Open";
}

function printFrame(title: string, inner: string) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@600;700&display=swap" />
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    html, body { margin: 0; background: #fff; color: #111; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font: 12.5px/1.4 Georgia, "Times New Roman", Times, serif; }
    .sheet { border: 2.5px solid #1a1a1a; min-height: 277mm; overflow: hidden; }
    .head {
      display: flex; align-items: center; gap: 14px;
      padding: 10px 14px; background: #14352c; color: #f4efe4;
    }
    .head img { height: 52px; width: auto; }
    .head h1 {
      margin: 0; font-family: "Cinzel Decorative", Algerian, serif;
      font-size: 22px; letter-spacing: .12em; color: #f4c430; font-weight: 900;
    }
    .head p { margin: 4px 0 0; font-family: Cinzel, Georgia, serif; font-size: 11px; letter-spacing: .08em; }
    .body { padding: 12px 14px 16px; }
    h2 {
      margin: 0 0 10px; text-align: center; font-family: Cinzel, Georgia, serif;
      font-size: 14px; letter-spacing: .16em; text-transform: uppercase;
      text-decoration: underline;
    }
    .src {
      margin: 16px 0 6px; font-family: Cinzel, Georgia, serif;
      font-size: 13px; letter-spacing: .1em; text-transform: uppercase;
      border-bottom: 1px solid #1a1a1a; padding-bottom: 3px;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #1a1a1a; padding: 6px 8px; vertical-align: top; }
    th {
      font-size: 10px; letter-spacing: .08em; text-transform: uppercase;
      text-align: left; background: #efe8d8; font-weight: 700;
    }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .ctr { text-align: center; }
    tfoot td { font-weight: 700; background: #f7f1e6; }
    .paid { color: #2f6b4f; font-weight: 700; }
    .open { color: #8a5a22; font-weight: 700; }
    .note { margin: 10px 0 0; color: #6f675c; font-size: 11px; }
  </style>
</head>
<body>${inner}</body>
</html>`;
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
    if (doc.fonts?.ready) {
      doc.fonts.ready.then(() => setTimeout(run, 80)).catch(() => setTimeout(run, 80));
      return;
    }
    setTimeout(run, 50);
  };
  if (doc.readyState === "complete") go();
  else iframe.onload = go;
}

function brand(hotel: string, place: string, title: string) {
  return `<div class="head">
    <img src="${publicUrl("logo.png?v=2")}" alt="" />
    <div style="flex:1;text-align:center">
      <h1>${escapeHtml(hotel.toUpperCase())}</h1>
      <p>${escapeHtml(place.toUpperCase())} · ${escapeHtml(title)}</p>
    </div>
  </div>`;
}

/** Print 1 — sources only, remaining balance, no guest rows. */
export function printSourceSummary(
  accounts: DueAccount[],
  hotel: string,
  place: string,
) {
  const rows = accounts
    .map(
      (a) => `<tr>
        <td>${escapeHtml(a.key)}</td>
        <td class="ctr">${a.guestCount}</td>
        <td class="ctr">${a.stays.length}</td>
        <td class="num">${inr(a.billed)}</td>
        <td class="num">${inr(a.collected)}</td>
        <td class="num ${a.settled ? "paid" : "open"}">${inr(Math.max(0, a.remaining))}</td>
      </tr>`,
    )
    .join("");
  const billed = accounts.reduce((s, a) => s + a.billed, 0);
  const paid = accounts.reduce((s, a) => s + a.collected, 0);
  const due = accounts.reduce((s, a) => s + Math.max(0, a.remaining), 0);
  const inner = `<div class="sheet">
    ${brand(hotel, place, "Outstanding by source")}
    <div class="body">
      <h2>Source balance</h2>
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th class="ctr">Guests</th>
            <th class="ctr">Stays</th>
            <th class="num">Billed</th>
            <th class="num">Paid</th>
            <th class="num">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="6" class="ctr">No source dues</td></tr>`}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td class="ctr">${accounts.reduce((s, a) => s + a.guestCount, 0)}</td>
            <td class="ctr">${accounts.reduce((s, a) => s + a.stays.length, 0)}</td>
            <td class="num">${inr(billed)}</td>
            <td class="num">${inr(paid)}</td>
            <td class="num">${inr(due)}</td>
          </tr>
        </tfoot>
      </table>
      <p class="note">Guest names are not listed. Use Print guests on a source for Flysky / Motor detail.</p>
    </div>
  </div>`;
  printFrame("Source balance", inner);
}

function stayRows(stays: DueStay[]) {
  return stays
    .map(
      (s) => `<tr>
        <td>${escapeHtml(s.name)}</td>
        <td>${stayStamp(s.checkIn)}</td>
        <td>${checkoutLabel(s)}</td>
        <td class="ctr">${s.days}</td>
        <td class="num">${inr(s.perDay)}</td>
        <td class="num">${inr(s.billed)}</td>
        <td class="${s.status === "paid" ? "paid" : "open"}">${escapeHtml(statusCell(s))}</td>
      </tr>`,
    )
    .join("");
}

function stayFoot(account: DueAccount) {
  return `<tfoot>
    <tr>
      <td colspan="3">${escapeHtml(account.key)} · ${account.stays.length} stay${account.stays.length === 1 ? "" : "s"}</td>
      <td class="ctr">${account.stays.reduce((n, s) => n + s.days, 0)}</td>
      <td></td>
      <td class="num">${inr(account.billed)}</td>
      <td class="num ${account.settled ? "paid" : "open"}">${inr(Math.max(0, account.remaining))} due</td>
    </tr>
  </tfoot>`;
}

/** Print 2 — one source, guest stay rows underneath. */
export function printSourceGuests(
  account: DueAccount,
  hotel: string,
  place: string,
) {
  const inner = `<div class="sheet">
    ${brand(hotel, place, `${account.key} outstanding`)}
    <div class="body">
      <h2>${escapeHtml(account.key)}</h2>
      <table>
        <thead>
          <tr>
            <th>Guest</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th class="ctr">Nights</th>
            <th class="num">Per day</th>
            <th class="num">Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${stayRows(account.stays) || `<tr><td colspan="7" class="ctr">No guests</td></tr>`}
        </tbody>
        ${stayFoot(account)}
      </table>
      <p class="note">Hotel day ${HOTEL_CLOCK}–${HOTEL_CLOCK}. Nights = check-out date minus check-in date. Paid ${inr(account.collected)} · billed ${inr(account.billed)} · oldest stays tick Paid first when a collection is posted.</p>
    </div>
  </div>`;
  printFrame(`${account.key} guests`, inner);
}
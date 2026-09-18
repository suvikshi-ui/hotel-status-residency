import { COMPLAINT_LEVELS, type ComplaintLevel, type RoomComplaint } from "./complaints";
import { escapeHtml, printDocument } from "./print-sheet";
import type { RoomDef } from "./types";

export type ComplaintListKind = "all" | "open" | "solved";

export const COMPLAINT_LIST_KIND: { id: ComplaintListKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "solved", label: "Solved" },
];

export function complaintStatus(level: ComplaintLevel) {
  return COMPLAINT_LEVELS.find((x) => x.id === level)?.label ?? level;
}

export function filterComplaints(rows: RoomComplaint[], kind: ComplaintListKind) {
  if (kind === "open") return rows.filter((c) => c.level !== "green");
  if (kind === "solved") return rows.filter((c) => c.level === "green");
  return rows;
}

export function sortComplaints(rows: RoomComplaint[], rooms: RoomDef[]) {
  const floorOf = new Map(rooms.map((r) => [r.no, r.floor]));
  const floorRank: Record<string, number> = {
    Ground: 0,
    First: 1,
    Second: 2,
    Third: 3,
  };
  return [...rows].sort((a, b) => {
    const fa = floorOf.get(a.roomNo) ?? "";
    const fb = floorOf.get(b.roomNo) ?? "";
    const ra = floorRank[fa] ?? 9;
    const rb = floorRank[fb] ?? 9;
    if (ra !== rb) return ra - rb;
    const na = Number(a.roomNo);
    const nb = Number(b.roomNo);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    if (a.roomNo !== b.roomNo) return a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true });
    return (a.createdAt || "").localeCompare(b.createdAt || "");
  });
}

export function complaintListTitle(kind: ComplaintListKind) {
  if (kind === "open") return "Open complaints";
  if (kind === "solved") return "Solved complaints";
  return "Complaint list";
}

export function complaintTableHtml(rows: RoomComplaint[], rooms: RoomDef[]) {
  const list = sortComplaints(rows, rooms);
  const floorOf = new Map(rooms.map((r) => [r.no, r.floor]));
  return `<table>
    <thead><tr>
      <th>Room</th><th>Floor</th><th>Problem</th><th>Status</th><th>Date</th>
    </tr></thead>
    <tbody>
      ${
        list.length
          ? list
              .map(
                (c) => `<tr>
        <td>${escapeHtml(c.roomNo)}</td>
        <td>${escapeHtml(floorOf.get(c.roomNo) ?? "")}</td>
        <td>${escapeHtml(c.note || "—")}</td>
        <td>${escapeHtml(complaintStatus(c.level))}</td>
        <td>${escapeHtml(c.createdAt || "")}</td>
      </tr>`,
              )
              .join("")
          : `<tr><td colspan="5">No complaints</td></tr>`
      }
    </tbody>
    <tfoot><tr>
      <td colspan="4">Total</td>
      <td class="num">${list.length}</td>
    </tr></tfoot>
  </table>`;
}

export function printComplaintList(input: {
  hotel: string;
  place: string;
  kind: ComplaintListKind;
  rows: RoomComplaint[];
  rooms: RoomDef[];
}) {
  const title = complaintListTitle(input.kind);
  printDocument({
    title,
    heading: input.hotel,
    sub: `${input.place} · ${title} · ${input.rows.length} ${input.rows.length === 1 ? "entry" : "entries"}`,
    table: complaintTableHtml(input.rows, input.rooms),
  });
}

export async function complaintListPdf(input: {
  hotel: string;
  place: string;
  kind: ComplaintListKind;
  rows: RoomComplaint[];
  rooms: RoomDef[];
}): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const list = sortComplaints(input.rows, input.rooms);
  const floorOf = new Map(input.rooms.map((r) => [r.no, r.floor]));
  const title = complaintListTitle(input.kind);
  const pageW = 210;
  const margin = 14;
  const bottom = 287;
  const cols = [
    { x: margin, w: 16, key: "room" as const },
    { x: margin + 16, w: 22, key: "floor" as const },
    { x: margin + 38, w: 86, key: "note" as const },
    { x: margin + 124, w: 32, key: "status" as const },
    { x: margin + 156, w: 26, key: "date" as const },
  ];

  let y = 18;
  pdf.setFont("times", "bold");
  pdf.setFontSize(16);
  pdf.text(input.hotel, margin, y);
  y += 6;
  pdf.setFont("times", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(80);
  pdf.text(`${input.place} · ${title}`, margin, y);
  y += 5;
  pdf.text(`${list.length} ${list.length === 1 ? "entry" : "entries"}`, margin, y);
  y += 8;
  pdf.setTextColor(20);

  function header() {
    pdf.setFont("times", "bold");
    pdf.setFontSize(9);
    pdf.setDrawColor(180);
    pdf.line(margin, y, pageW - margin, y);
    y += 5;
    pdf.text("Room", cols[0].x, y);
    pdf.text("Floor", cols[1].x, y);
    pdf.text("Problem", cols[2].x, y);
    pdf.text("Status", cols[3].x, y);
    pdf.text("Date", cols[4].x, y);
    y += 2;
    pdf.line(margin, y, pageW - margin, y);
    y += 5;
    pdf.setFont("times", "normal");
    pdf.setFontSize(10);
  }

  header();

  if (!list.length) {
    pdf.text("No complaints", margin, y);
  }

  for (const c of list) {
    const note = pdf.splitTextToSize(c.note || "—", cols[2].w - 2) as string[];
    const h = Math.max(6, note.length * 5);
    if (y + h > bottom) {
      pdf.addPage();
      y = 18;
      header();
    }
    pdf.text(c.roomNo, cols[0].x, y);
    pdf.text(String(floorOf.get(c.roomNo) ?? ""), cols[1].x, y);
    pdf.text(note, cols[2].x, y);
    pdf.text(complaintStatus(c.level), cols[3].x, y);
    pdf.text(c.createdAt || "", cols[4].x, y);
    y += h;
  }

  y += 2;
  if (y > bottom) {
    pdf.addPage();
    y = 18;
  }
  pdf.setFont("times", "bold");
  pdf.line(margin, y, pageW - margin, y);
  y += 6;
  pdf.text(`Total  ${list.length}`, margin, y);

  return pdf.output("blob");
}

export function downloadComplaintPdf(blob: Blob, kind: ComplaintListKind) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${complaintListTitle(kind).toLowerCase().replace(/\s+/g, "-")}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

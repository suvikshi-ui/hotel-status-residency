import { publicUrl } from "./public-url";

const GREEN: [number, number, number] = [27, 51, 42];

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

function line(pdf: import("jspdf").jsPDF, x: number, y: number, w: number) {
  pdf.setDrawColor(90, 98, 94);
  pdf.setLineWidth(0.25);
  pdf.line(x, y, x + w, y);
}

function box(pdf: import("jspdf").jsPDF, x: number, y: number) {
  pdf.setDrawColor(40, 48, 44);
  pdf.setLineWidth(0.35);
  pdf.rect(x, y - 3.1, 3.4, 3.4);
}

export async function downloadGuestCheckinPdf() {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const m = 12;
  const W = 210 - m * 2;
  const x = m;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 210, 297, "F");

  const headH = 32;
  pdf.setFillColor(...GREEN);
  pdf.roundedRect(x, m, W, headH, 2, 2, "F");

  const logo = await logoDataUrl();
  if (logo) {
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x + 3, m + 4, 24, 24, 2, 2, "F");
    try {
      pdf.addImage(logo, "PNG", x + 4.2, m + 5.2, 21.6, 21.6);
    } catch {
      /* header still prints */
    }
  }

  const tx = x + 32;
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("Hotel Status Residency — Guest Check-in", tx, m + 12);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text(
    "PAP-595/596, TTC MIDC Mahape, Navi Mumbai 400701 · FabHotel Status Residency",
    tx,
    m + 18.5,
  );
  pdf.setFontSize(8);
  pdf.text("Please fill in under 2 minutes", tx, m + 24);

  let y = m + headH + 12;
  pdf.setTextColor(70, 78, 74);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  const col = (W - 8) / 3;
  ["DATE", "ROOM", "STAFF"].forEach((label, i) => {
    const cx = x + i * (col + 4);
    pdf.text(label, cx, y);
    line(pdf, cx, y + 8, col);
  });

  y += 20;
  const fields: { title: string; hint?: string }[] = [
    { title: "1. Full name" },
    { title: "2. Phone / WhatsApp", hint: "Add country code if not an Indian number" },
    { title: "3. Company (if any)" },
    { title: "4. City or project you came from" },
  ];
  pdf.setTextColor(20, 24, 22);
  for (const field of fields) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(field.title, x, y);
    if (field.hint) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(110, 116, 112);
      pdf.text(field.hint, x, y + 4.5);
      pdf.setTextColor(20, 24, 22);
      y += 5;
    }
    line(pdf, x, y + 8, W);
    y += 16;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("5. Who booked? (tick one)", x, y);
  y += 8;
  const choices: [string, number][] = [
    ["OTA / booking app", x],
    ["Company", x + 95],
    ["Self / friend / relative", x],
  ];
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  box(pdf, choices[0][1], y);
  pdf.text(choices[0][0], choices[0][1] + 5.5, y);
  box(pdf, choices[1][1], y);
  pdf.text(choices[1][0], choices[1][1] + 5.5, y);
  y += 8;
  box(pdf, x, y);
  pdf.text("Self / friend / relative", x + 5.5, y);
  y += 8;
  box(pdf, x, y);
  pdf.text("Travel agent", x + 5.5, y);
  pdf.text("Name", x + 38, y);
  line(pdf, x + 50, y + 1, 48);
  pdf.text("Phone", x + 104, y);
  line(pdf, x + 118, y + 1, 58);

  y += 14;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("6. Check-out date", x, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(110, 116, 112);
  pdf.text("DD / MM / YYYY", x, y + 4.5);
  pdf.setTextColor(20, 24, 22);
  line(pdf, x, y + 12, W);

  y += 22;
  pdf.setFillColor(245, 247, 246);
  pdf.setDrawColor(210, 216, 212);
  pdf.roundedRect(x, y, W, 28, 1.5, 1.5, "FD");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90, 98, 94);
  pdf.text("Guest signature", x + 4, y + 16);
  line(pdf, x + 36, y + 16, 70);
  pdf.text("Date", x + 118, y + 16);
  line(pdf, x + 130, y + 16, 46);

  pdf.setFontSize(8);
  pdf.setTextColor(90, 98, 94);
  pdf.text(
    "For hotel records and guest service only. We do not sell your details.",
    105,
    278,
    { align: "center" },
  );
  pdf.text("Hotel Status Residency · Mahape — keep at reception desk", 105, 283, {
    align: "center",
  });

  pdf.save("Hotel-Status-Residency-Guest-Check-in.pdf");
}

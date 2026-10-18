import { publicUrl } from "./public-url";

export const REPORT_HEAD_CSS = `
.report-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 0 12px;
  padding: 8px 12px;
  background: #1b332a;
  color: #f6f0e6;
}
.report-head img {
  height: 52px;
  width: auto;
  flex-shrink: 0;
  object-fit: contain;
  transform: perspective(180px) rotateX(10deg) rotateY(-12deg);
  filter:
    drop-shadow(0 1px 0 rgba(255, 236, 186, 0.7))
    drop-shadow(0 3px 0 rgba(62, 40, 8, 0.65))
    drop-shadow(0 8px 10px rgba(0, 0, 0, 0.55));
}
.report-head .mid { flex: 1; min-width: 0; text-align: center; }
.report-head h1 {
  margin: 0;
  font-family: Fraunces, "Times New Roman", serif;
  font-weight: 700;
  font-size: 26px;
  letter-spacing: 0.04em;
  line-height: 1.05;
  color: #f4c430;
  white-space: nowrap;
  transform: perspective(180px) rotateX(8deg) scaleX(0.96);
  transform-origin: center;
  text-shadow:
    0 1px 0 #fff1b0,
    0 2px 0 #b8892a,
    0 4px 0 #6d5010,
    0 6px 8px rgba(0, 0, 0, 0.45);
}
.report-head .bless {
  margin: 2px 0 0;
  font-family: Fraunces, "Times New Roman", serif;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: -0.02em;
}
.report-head .right {
  flex-shrink: 0;
  max-width: 46mm;
  text-align: right;
  font-family: Fraunces, "Times New Roman", serif;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: -0.02em;
}
`;

export function reportHeadHtml(input: {
  hotel: string;
  blessing?: string;
  right?: string;
}) {
  const hotel = escapeHtml(input.hotel);
  const bless = input.blessing
    ? `<p class="bless">${escapeHtml(input.blessing)}</p>`
    : "";
  const right = input.right
    ? `<div class="right">${escapeHtml(input.right)}</div>`
    : "";
  return `<header class="report-head">
    <img src="${publicUrl("logo.png?v=2")}" alt="" />
    <div class="mid"><h1>${hotel}</h1>${bless}</div>
    ${right}
  </header>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

type PdfPaint = {
  setFillColor: (r: number, g: number, b: number) => void;
  rect: (x: number, y: number, w: number, h: number, style?: string) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  setFont: (font: string, style: string) => void;
  setFontSize: (size: number) => void;
  text: (text: string, x: number, y: number, options?: { align?: "left" | "center" | "right" }) => void;
  addImage: (data: string, format: string, x: number, y: number, w: number, h: number) => void;
};

export async function logoDataUrl() {
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

/** Charcoal bar, gold hotel name, logo. Returns the y under the bar. */
export async function paintPdfReportHead(
  pdf: PdfPaint,
  input: {
    x: number;
    y: number;
    w: number;
    h?: number;
    hotel: string;
    blessing?: string;
    right?: string;
  },
) {
  const h = input.h ?? 18;
  pdf.setFillColor(27, 51, 42);
  pdf.rect(input.x, input.y, input.w, h, "F");
  const logo = await logoDataUrl();
  if (logo) {
    try {
      pdf.addImage(logo, "PNG", input.x + 2, input.y + 2, 14, h - 4);
    } catch {
      /* bar still prints */
    }
  }
  const cx = input.x + input.w / 2;
  pdf.setFont("times", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(90, 58, 10);
  pdf.text(input.hotel, cx + 0.4, input.y + 8.4, { align: "center" });
  pdf.setTextColor(244, 196, 48);
  pdf.text(input.hotel, cx, input.y + 7.8, { align: "center" });
  if (input.blessing) {
    pdf.setFontSize(8);
    pdf.setTextColor(246, 240, 230);
    pdf.text(input.blessing, cx, input.y + 13.2, { align: "center" });
  }
  if (input.right) {
    pdf.setFont("times", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(246, 240, 230);
    pdf.text(input.right, input.x + input.w - 3, input.y + 8, { align: "right" });
  }
  return input.y + h;
}

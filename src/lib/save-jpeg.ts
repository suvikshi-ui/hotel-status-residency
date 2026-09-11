import { A4_PX } from "./print-sheet";

function waitImages(root: HTMLElement) {
  return Promise.all(
    [...root.querySelectorAll("img")].map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          }),
    ),
  );
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename.toLowerCase().endsWith(".jpg")
    ? filename
    : `${filename}.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function canvasLooksEmpty(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx || canvas.width < 10 || canvas.height < 10) return true;
  const w = Math.min(80, canvas.width);
  const h = Math.min(80, canvas.height);
  const { data } = ctx.getImageData(0, 0, w, h);
  let dark = 0;
  for (let i = 0; i < data.length; i += 20) {
    if (data[i] < 248 || data[i + 1] < 248 || data[i + 2] < 248) dark += 1;
  }
  return dark < 6;
}

async function captureVisible(el: HTMLElement): Promise<HTMLCanvasElement> {
  await document.fonts?.ready.catch(() => undefined);
  await waitImages(el);
  el.scrollIntoView({ block: "nearest" });
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  try {
    const { toCanvas } = await import("html-to-image");
    const canvas = await toCanvas(el, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      skipAutoScale: true,
    });
    if (!canvasLooksEmpty(canvas)) return canvas;
  } catch {
    /* fall through */
  }

  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    foreignObjectRendering: false,
    logging: false,
    imageTimeout: 4000,
  });
  if (canvasLooksEmpty(canvas)) throw new Error("report capture was blank");
  return canvas;
}

function composeA4(sheet: HTMLCanvasElement): HTMLCanvasElement {
  const scale = 2;
  const a4 = document.createElement("canvas");
  a4.width = A4_PX.width * scale;
  a4.height = A4_PX.height * scale;
  const ctx = a4.getContext("2d");
  if (!ctx) throw new Error("a4 canvas missing");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, a4.width, a4.height);
  const margin = (A4_PX.marginMm / 25.4) * 96 * scale;
  const boxW = a4.width - margin * 2;
  const boxH = a4.height - margin * 2;
  const ratio = Math.min(boxW / sheet.width, boxH / sheet.height);
  const w = sheet.width * ratio;
  const h = sheet.height * ratio;
  ctx.drawImage(sheet, margin + (boxW - w) / 2, margin + (boxH - h) / 2, w, h);
  return a4;
}

async function a4PageFromElement(el: HTMLElement): Promise<HTMLCanvasElement> {
  return composeA4(await captureVisible(el));
}

/** One A4 PDF — Print and JPEG both use this page. */
export async function pdfFromPrintElement(el: HTMLElement): Promise<Blob> {
  const page = await a4PageFromElement(el);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  pdf.addImage(page.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
  return pdf.output("blob");
}

export async function printPdfBlob(blob: Blob) {
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

export async function printElementPdf(el: HTMLElement) {
  await printPdfBlob(await pdfFromPrintElement(el));
}

/** JPEG is the same A4 page that goes into the PDF. */
export async function saveElementJpeg(el: HTMLElement, filename: string) {
  const page = await a4PageFromElement(el);
  if (canvasLooksEmpty(page)) throw new Error("jpeg was blank");
  downloadDataUrl(page.toDataURL("image/jpeg", 0.95), filename);
}

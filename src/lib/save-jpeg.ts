import { A4_PRINT_CSS, A4_PX, CINZEL_FONT_HREF } from "./print-sheet";

function waitImages(root: HTMLElement) {
  return Promise.all(
    [...root.querySelectorAll("img")].map((img) => {
      img.src = img.src;
      return img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          });
    }),
  );
}

async function inlineImages(root: HTMLElement) {
  await Promise.all(
    [...root.querySelectorAll("img")].map(async (img) => {
      try {
        const res = await fetch(img.currentSrc || img.src);
        if (!res.ok) return;
        const blob = await res.blob();
        img.src = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      } catch {
        /* keep original src */
      }
    }),
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

function mountPrintPage(el: HTMLElement) {
  const page = document.createElement("div");
  page.setAttribute("aria-hidden", "true");
  page.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${A4_PX.width}px`,
    `height:${A4_PX.height}px`,
    "margin:0",
    "padding:0",
    "background:#fff",
    "z-index:-1",
    "pointer-events:none",
  ].join(";");

  const style = document.createElement("style");
  style.textContent = `@import url("${CINZEL_FONT_HREF}");
${A4_PRINT_CSS}
.a4-page {
  width: ${A4_PX.width}px;
  height: ${A4_PX.height}px;
  padding: ${A4_PX.marginMm}mm;
  background: #fff;
  box-sizing: border-box;
}`;

  const sheet = document.createElement("div");
  sheet.className = "a4-page";
  const clone = el.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.style.width = "100%";
  clone.style.height = "100%";
  clone.style.minHeight = "0";
  clone.style.maxHeight = "none";
  clone.style.maxWidth = "none";
  clone.style.margin = "0";
  clone.style.transform = "none";
  sheet.appendChild(clone);
  page.appendChild(style);
  page.appendChild(sheet);
  document.body.appendChild(page);
  return { page, sheet, clone };
}

async function rasterPrintPage(sheet: HTMLElement) {
  const html2canvas = (await import("html2canvas")).default;
  const opts = {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: A4_PX.width,
    height: A4_PX.height,
    windowWidth: A4_PX.width,
    windowHeight: A4_PX.height,
    imageTimeout: 4000,
    logging: false,
  };
  let canvas = await html2canvas(sheet, { ...opts, foreignObjectRendering: true });
  if (canvasLooksEmpty(canvas)) {
    canvas = await html2canvas(sheet, { ...opts, foreignObjectRendering: false });
  }
  return canvas;
}

function canvasLooksEmpty(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return true;
  const w = Math.min(48, canvas.width);
  const h = Math.min(48, canvas.height);
  const { data } = ctx.getImageData(0, 0, w, h);
  let dark = 0;
  for (let i = 0; i < data.length; i += 16) {
    if (data[i] < 248 || data[i + 1] < 248 || data[i + 2] < 248) dark += 1;
  }
  return dark < 4;
}

/** Build the same A4 PDF the Print button produces. */
export async function pdfFromPrintElement(el: HTMLElement): Promise<Blob> {
  const { page, sheet, clone } = mountPrintPage(el);
  try {
    await document.fonts?.ready.catch(() => undefined);
    await inlineImages(clone);
    await waitImages(clone);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const canvas = await rasterPrintPage(sheet);
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      0,
      0,
      210,
      297,
    );
    return pdf.output("blob");
  } finally {
    page.remove();
  }
}

export async function jpegFromPdfBlob(pdfBlob: Blob): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const data = new Uint8Array(await pdfBlob.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("jpeg canvas missing");
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas.toDataURL("image/jpeg", 0.95);
}

/** Print the A4 sheet to PDF, then convert that PDF page to JPEG. */
export async function saveElementJpeg(el: HTMLElement, filename: string) {
  const pdf = await pdfFromPrintElement(el);
  const dataUrl = await jpegFromPdfBlob(pdf);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("jpeg load failed"));
    i.src = dataUrl;
  });
  if (img.width < 400 || img.height < 400) {
    throw new Error("jpeg was cropped");
  }
  downloadDataUrl(dataUrl, filename);
}

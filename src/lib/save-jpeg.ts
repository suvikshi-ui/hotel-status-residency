import { a4PrintDocument, A4_PX } from "./print-sheet";

function waitImages(root: ParentNode) {
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

async function toDataUrl(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("image fetch failed");
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function innerWithDataImages(el: HTMLElement) {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  await Promise.all(
    [...clone.querySelectorAll("img")].map(async (img) => {
      try {
        img.src = await toDataUrl(img.currentSrc || img.src);
      } catch {
        /* keep src */
      }
    }),
  );
  return clone.outerHTML;
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

function openFrame() {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${A4_PX.width}px`,
    `height:${A4_PX.height}px`,
    "border:0",
    "margin:0",
    "background:#fff",
    "z-index:2147483645",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(iframe);
  return iframe;
}

async function paintFrame(el: HTMLElement) {
  const iframe = openFrame();
  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    throw new Error("print frame missing");
  }
  doc.open();
  doc.write(a4PrintDocument("Daily report", await innerWithDataImages(el)));
  doc.close();
  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    setTimeout(() => resolve(), 400);
  });
  try {
    await doc.fonts?.ready.catch(() => undefined);
  } catch {
    /* ignore */
  }
  await waitImages(doc);
  await new Promise((r) => setTimeout(r, 80));
  return { iframe, doc };
}

async function rasterFrame(doc: Document): Promise<HTMLCanvasElement> {
  const target = (doc.querySelector(".a4-page") || doc.body) as HTMLElement;
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(target, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: A4_PX.width,
    height: A4_PX.height,
    windowWidth: A4_PX.width,
    windowHeight: A4_PX.height,
    foreignObjectRendering: false,
    logging: false,
    imageTimeout: 8000,
  });
  if (!canvasLooksEmpty(canvas)) return canvas;

  const { toCanvas } = await import("html-to-image");
  const again = await toCanvas(target, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    width: A4_PX.width,
    height: A4_PX.height,
    cacheBust: true,
    skipAutoScale: true,
  });
  if (canvasLooksEmpty(again)) throw new Error("report capture was blank");
  return again;
}

async function a4PageFromElement(el: HTMLElement): Promise<HTMLCanvasElement> {
  const { iframe, doc } = await paintFrame(el);
  try {
    return await rasterFrame(doc);
  } finally {
    iframe.remove();
  }
}

export async function pdfFromPrintElement(el: HTMLElement): Promise<Blob> {
  const page = await a4PageFromElement(el);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  pdf.addImage(page.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, 297);
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

export async function saveElementJpeg(el: HTMLElement, filename: string) {
  const page = await a4PageFromElement(el);
  if (canvasLooksEmpty(page)) throw new Error("jpeg was blank");
  downloadDataUrl(page.toDataURL("image/jpeg", 0.92), filename);
}

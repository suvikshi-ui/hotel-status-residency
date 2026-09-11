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

/** Same A4 page the PDF print uses, saved as a JPEG. */
export async function saveElementJpeg(el: HTMLElement, filename: string) {
  const { toJpeg } = await import("html-to-image");

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

  try {
    await document.fonts?.ready.catch(() => undefined);
    await waitImages(clone);
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const dataUrl = await toJpeg(sheet, {
      quality: 0.95,
      pixelRatio: 2,
      width: A4_PX.width,
      height: A4_PX.height,
      canvasWidth: A4_PX.width * 2,
      canvasHeight: A4_PX.height * 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      skipAutoScale: true,
      style: {
        width: `${A4_PX.width}px`,
        height: `${A4_PX.height}px`,
        transform: "none",
        overflow: "hidden",
        background: "#ffffff",
      },
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("jpeg load failed"));
      i.src = dataUrl;
    });
    if (img.width < A4_PX.width || img.height < A4_PX.height * 0.9) {
      throw new Error("jpeg was cropped");
    }

    downloadDataUrl(dataUrl, filename);
  } finally {
    page.remove();
  }
}

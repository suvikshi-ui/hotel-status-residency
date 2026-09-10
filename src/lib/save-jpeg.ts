const A4_W = 794;
const A4_H = 1123;

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

export async function saveElementJpeg(el: HTMLElement, filename: string) {
  const { toJpeg } = await import("html-to-image");

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${A4_W}px`,
    `height:${A4_H}px`,
    "overflow:hidden",
    "background:#fff",
    "z-index:2147483646",
    "pointer-events:none",
    "opacity:0",
  ].join(";");

  const clone = el.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.style.width = `${A4_W}px`;
  clone.style.height = `${A4_H}px`;
  clone.style.minHeight = `${A4_H}px`;
  clone.style.maxHeight = `${A4_H}px`;
  clone.style.maxWidth = `${A4_W}px`;
  clone.style.overflow = "hidden";
  clone.style.borderRadius = "0";
  clone.style.transform = "none";
  clone.style.margin = "0";
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    await document.fonts?.ready.catch(() => undefined);
    await waitImages(clone);
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const dataUrl = await toJpeg(clone, {
      quality: 0.95,
      pixelRatio: 2,
      width: A4_W,
      height: A4_H,
      backgroundColor: "#ffffff",
      cacheBust: true,
      skipAutoScale: true,
      style: {
        width: `${A4_W}px`,
        height: `${A4_H}px`,
        transform: "none",
        overflow: "hidden",
      },
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("jpeg load failed"));
      i.src = dataUrl;
    });
    if (img.width < A4_W || img.height < A4_H * 0.9) {
      throw new Error("jpeg was cropped");
    }

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename.toLowerCase().endsWith(".jpg")
      ? filename
      : `${filename}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    host.remove();
  }
}

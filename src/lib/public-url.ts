/** Vite `base` (always ends with `/`). Use for public assets under GitHub Pages. */
export function publicUrl(path: string) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${path.replace(/^\//, "")}`;
}

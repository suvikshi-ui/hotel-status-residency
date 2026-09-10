#!/usr/bin/env node
/**
 * Belt-and-suspenders for `npm run build:pages`.
 * Ensures GitHub Pages gets index.html, 404.html (SPA fallback) and .nojekyll
 * even if the Vite plugin did not run.
 *
 * Do not copy hashed assets to the workspace root — a root `assets/*.css`
 * folder makes the default Vercel/Nitro build fail.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPagesHtml } from "./github-pages-plugin.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, ".output", "public");

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function publicBase() {
  const full = process.env.GITHUB_REPOSITORY ?? "suvikshi-ui/hotel-status-residency";
  const [owner, repo] = full.split("/");
  if (!repo || (owner && repo === `${owner}.github.io`)) return "/";
  return `/${repo}/`;
}

function firstExisting(...paths) {
  return paths.find((p) => existsSync(p) && statSync(p).size > 32);
}

mkdirSync(outDir, { recursive: true });

const files = walk(outDir);
const jsAssets = files.filter((f) => f.includes(`${join("assets")}`) && f.endsWith(".js"));
if (jsAssets.length === 0) {
  console.error("pages-finalize: no JS assets in .output/public — build did not produce a client bundle");
  process.exit(1);
}

let htmlPath = firstExisting(
  join(outDir, "index.html"),
  join(outDir, "_shell.html"),
  join(outDir, "index"),
);

if (!htmlPath) {
  const cssFiles = files
    .filter((f) => f.endsWith(".css"))
    .map((f) => f.slice(outDir.length + 1).replaceAll("\\", "/"));
  const entry =
    jsAssets
      .map((f) => f.slice(outDir.length + 1).replaceAll("\\", "/"))
      .find((f) => f.startsWith("assets/index-")) ??
    jsAssets[0].slice(outDir.length + 1).replaceAll("\\", "/");
  const html = renderPagesHtml({
    base: publicBase(),
    entryFile: entry,
    cssFiles,
  });
  writeFileSync(join(outDir, "index.html"), html);
  htmlPath = join(outDir, "index.html");
  console.log("pages-finalize: wrote fallback index.html");
} else if (!htmlPath.endsWith(".html")) {
  const html = readFileSync(htmlPath, "utf8");
  writeFileSync(join(outDir, "index.html"), html);
  htmlPath = join(outDir, "index.html");
}

const indexHtml = readFileSync(htmlPath, "utf8");
if (
  !indexHtml.includes("<html") ||
  !indexHtml.includes("script") ||
  !indexHtml.includes('id="root"') ||
  !indexHtml.includes("Hotel Status Residency")
) {
  console.error("pages-finalize: index.html is not a usable SPA document");
  process.exit(1);
}

copyFileSync(htmlPath, join(outDir, "404.html"));
writeFileSync(join(outDir, ".nojekyll"), "");

console.log("pages-finalize: index.html + 404.html + .nojekyll ready");

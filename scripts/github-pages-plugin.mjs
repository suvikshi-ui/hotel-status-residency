/**
 * GitHub Pages static SPA helper (client environment only).
 *
 * Nitro's `github-pages` preset dies on Vite 8 / Rolldown
 * (`input should not be an html file when building for SSR`). This plugin
 * writes the SPA shell after the client bundle so Pages can serve the app
 * from `/<repo>/` with a 404.html fallback for client routes.
 *
 * The shell mounts into `#root` with `createRoot` (see `src/client.tsx`).
 * `window.$_TSR` is still required: StartClient hydrates the router, not the
 * DOM.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function collectAssets(bundle) {
  let entryFile = "";
  const cssFiles = new Set();

  for (const item of Object.values(bundle)) {
    if (item.type === "chunk" && item.isEntry) {
      entryFile = item.fileName;
      const imported = item.viteMetadata?.importedCss;
      if (imported) {
        for (const file of imported) cssFiles.add(file);
      }
    }
    if (item.type === "asset" && typeof item.fileName === "string" && item.fileName.endsWith(".css")) {
      cssFiles.add(item.fileName);
    }
  }

  return { entryFile, cssFiles: [...cssFiles] };
}

export function renderPagesHtml({ base, entryFile, cssFiles }) {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const cssLinks = cssFiles
    .map(
      (file) =>
        `    <link rel="stylesheet" crossorigin href="${prefix}${file.replace(/^\//, "")}">`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en" class="antialiased">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#1F5C54">
    <title>Status Ledger</title>
    <meta name="description" content="Daily cash book, occupancy and night audit for Hotel Status Residency, Mahape.">
    <link rel="icon" type="image/png" href="${prefix}favicon.png">
    <link rel="icon" type="image/svg+xml" href="${prefix}favicon.svg">
    <link rel="apple-touch-icon" href="${prefix}__grok/icon-180.png">
${cssLinks}
  </head>
  <body>
    <div id="root">
      <div style="min-height:100dvh;display:grid;place-items:center;background:#f3eee4;color:#1f5c54;font-family:Figtree,system-ui,sans-serif;padding:24px;text-align:center">
        <div>
          <p style="margin:0 0 8px;letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#6f675c">Night audit</p>
          <h1 style="margin:0;font-size:clamp(1.6rem,4vw,2.4rem);line-height:1.15">Hotel Status Residency</h1>
          <p style="margin:10px 0 0;color:#6f675c">Status Ledger · Mahape</p>
        </div>
      </div>
    </div>
    <script>
      window.$_TSR = {
        router: { manifest: undefined, matches: [] },
        buffer: [],
        h: function () {},
        e: function () {},
        c: function () {},
        p: function (script) { this.buffer.push(script); }
      };
    </script>
    <script type="module" crossorigin src="${prefix}${entryFile.replace(/^\//, "")}"></script>
  </body>
</html>
`;
}

export function githubPagesPlugin(base) {
  return {
    name: "github-pages-spa",
    apply: "build",
    applyToEnvironment(env) {
      return env.name === "client";
    },
    writeBundle(options, bundle) {
      const { entryFile, cssFiles } = collectAssets(bundle);
      if (!entryFile) {
        this.error("GitHub Pages: client entry chunk was not emitted");
        return;
      }

      const html = renderPagesHtml({ base, entryFile, cssFiles });
      const dir = options.dir;
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "index.html"), html);
      writeFileSync(join(dir, "404.html"), html);
      writeFileSync(join(dir, ".nojekyll"), "");
      this.info(`GitHub Pages shell → ${join(dir, "index.html")} (entry ${entryFile})`);
    },
  };
}

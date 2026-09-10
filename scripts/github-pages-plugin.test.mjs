import assert from "node:assert/strict";
import test from "node:test";
import { renderPagesHtml } from "./github-pages-plugin.mjs";

test("Pages shell mounts #root and names the hotel before JS runs", () => {
  const html = renderPagesHtml({
    base: "/hotel-status-residency/",
    entryFile: "assets/index-test.js",
    cssFiles: ["assets/styles-test.css"],
  });
  assert.match(html, /id="root"/);
  assert.match(html, /Hotel Status Residency/);
  assert.match(html, /Mahape/);
  assert.match(html, /type="module"/);
  assert.match(html, /\/hotel-status-residency\/assets\/index-test\.js/);
  assert.match(html, /\/hotel-status-residency\/assets\/styles-test\.css/);
  assert.doesNotMatch(html, /<html[\s\S]*<html/);
});

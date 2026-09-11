import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { A4_PRINT_CSS, A4_PX, a4PrintDocument } from "./print-sheet.ts";

describe("A4 print page", () => {
  it("uses the same A4 sheet for PDF and JPEG", () => {
    assert.equal(A4_PX.width, 794);
    assert.equal(A4_PX.height, 1123);
    assert.equal(A4_PX.marginMm, 8);
    assert.match(A4_PRINT_CSS, /size: A4 portrait/);
    assert.match(A4_PRINT_CSS, /daily-a4-head/);
    const html = a4PrintDocument("Daily report", '<div class="daily-a4"></div>');
    assert.match(html, /Cinzel/);
    assert.match(html, /class="daily-a4"/);
  });
});

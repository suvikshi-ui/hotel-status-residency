import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDailyPdf } from "./daily-pdf.ts";
import { buildDayTake } from "./day-report.ts";

describe("daily PDF", () => {
  it("builds a real PDF that JPEG can convert", async () => {
    const pdf = await buildDailyPdf({
      hotel: "Hotel Status Residency",
      blessing: "Welcome",
      date: "2026-09-12",
      books: undefined,
      take: buildDayTake([], [], []),
      expenses: [],
      receipts: [],
      guests: [],
    });
    const out = pdf.output("arraybuffer");
    const head = String.fromCharCode(...new Uint8Array(out).slice(0, 4));
    assert.equal(head, "%PDF");
    assert.ok(out.byteLength > 1000);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mergeGuestGst, withGuestGst } from "./invoice.ts";
import type { GuestEntry } from "./types.ts";

function g(id: string, gst?: boolean): GuestEntry {
  return {
    id,
    date: "2026-09-17",
    slNo: 1,
    name: "RAMESH",
    roomNo: "101",
    mode: "CASH",
    amount: 1500,
    gst,
  };
}

describe("invoice gst flag", () => {
  it("marks ids from hotel as GST", () => {
    const next = withGuestGst([g("a"), g("b")], ["b"]);
    assert.equal(next[0]?.gst, false);
    assert.equal(next[1]?.gst, true);
  });

  it("keeps this desk's GST tick when the other desk has not marked it", () => {
    const next = mergeGuestGst([g("a"), g("b")], [g("a", true), g("b")], [g("a"), g("b")]);
    assert.equal(next[0]?.gst, true);
    assert.equal(next[1]?.gst, false);
  });
});

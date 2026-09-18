import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildGstStayBills, mergeGuestGst, withGuestGst } from "./invoice.ts";
import { applyGuestPatch } from "./stay.ts";
import type { GuestEntry } from "./types.ts";

function g(
  id: string,
  extra: Partial<GuestEntry> = {},
): GuestEntry {
  return {
    id,
    date: "2026-09-17",
    slNo: 1,
    name: "RAMESH",
    roomNo: "101",
    mode: "CASH",
    amount: 1500,
    ...extra,
  };
}

describe("invoice gst flag", () => {
  it("marks ids from hotel as GST and copies invoice numbers", () => {
    const next = withGuestGst([g("a"), g("b")], ["b"], [
      { id: "b", invoiceNo: "GST-12", payRef: "UPI-9" },
    ]);
    assert.equal(next[0]?.gst, false);
    assert.equal(next[1]?.gst, true);
    assert.equal(next[1]?.gstInvoiceNo, "GST-12");
    assert.equal(next[1]?.payRefNo, "UPI-9");
  });

  it("keeps this desk's GST tick when the other desk has not marked it", () => {
    const next = mergeGuestGst(
      [g("a"), g("b")],
      [g("a", { gst: true, gstInvoiceNo: "1" }), g("b")],
      [g("a"), g("b")],
    );
    assert.equal(next[0]?.gst, true);
    assert.equal(next[0]?.gstInvoiceNo, "1");
    assert.equal(next[1]?.gst, false);
  });

  it("groups check-in to check-out as one GST invoice", () => {
    const bills = buildGstStayBills([
      g("n1", { date: "2026-09-01", gst: true, checkIn: "2026-09-01", stay: "continue", amount: 2000 }),
      g("n2", { date: "2026-09-02", gst: true, checkIn: "2026-09-01", stay: "continue", amount: 2000 }),
      g("n3", { date: "2026-09-03", gst: true, checkIn: "2026-09-01", stay: "out", checkOut: "2026-09-04", amount: 2000, gstInvoiceNo: "GST-88" }),
    ]);
    assert.equal(bills.length, 1);
    assert.equal(bills[0]?.checkIn, "2026-09-01");
    assert.equal(bills[0]?.checkOut, "2026-09-04");
    assert.equal(bills[0]?.nights, 3);
    assert.equal(bills[0]?.amount, 6000);
    assert.equal(bills[0]?.gstInvoiceNo, "GST-88");
  });

  it("shows the Balance receive payment reference on the GST stay", () => {
    const bills = buildGstStayBills(
      [
        g("n1", {
          date: "2026-09-01",
          gst: true,
          source: "Flysky",
          mode: "BALANCE",
          stay: "out",
          checkOut: "2026-09-02",
        }),
      ],
      [
        {
          id: "r1",
          date: "2026-09-05",
          particular: "Flysky",
          mode: "CASH",
          amount: 1500,
          kind: "due",
          payRef: "UPI-4411",
        },
      ],
    );
    assert.equal(bills[0]?.payRefNo, "UPI-4411");
  });

  it("copies one GST invoice number across the stay nights", () => {
    const nights = [
      g("n1", { date: "2026-09-01", gst: true, stay: "continue" }),
      g("n2", { date: "2026-09-02", gst: true, stay: "out", checkOut: "2026-09-03" }),
    ];
    const next = applyGuestPatch(nights, "n1", { gstInvoiceNo: "GST-1" });
    assert.equal(next[0]?.gstInvoiceNo, "GST-1");
    assert.equal(next[1]?.gstInvoiceNo, "GST-1");
  });
});

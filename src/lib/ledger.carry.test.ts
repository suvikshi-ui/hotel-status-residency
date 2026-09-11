import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { closeAsPrev, rebuildDayBooks } from "./ledger.ts";
import type { GuestEntry, NamedAmount, OpeningBalances } from "./types.ts";

const opening: OpeningBalances = {
  cash: 0,
  santosh: 0,
  pk: 0,
  online: 0,
  outstanding: 0,
};

function guest(
  date: string,
  amount: number,
  mode: GuestEntry["mode"],
): GuestEntry {
  return {
    id: `g-${date}-${mode}-${amount}`,
    date,
    slNo: 1,
    name: "Test",
    roomNo: "101",
    mode,
    amount,
  };
}

function booksFor(
  guests: GuestEntry[],
  through: string,
  extra?: {
    expenses?: NamedAmount[];
    balReceived?: NamedAmount[];
    opening?: OpeningBalances;
  },
) {
  const days = rebuildDayBooks({
    openingDate: "2026-09-01",
    opening: extra?.opening ?? opening,
    guests,
    food: [],
    wholesale: [],
    expenses: extra?.expenses ?? [],
    balReceived: extra?.balReceived ?? [],
    throughDates: [through],
  });
  const map = new Map(days.map((d) => [d.date, d]));
  return { days, map };
}

describe("balance carry-forward", () => {
  it("next day cash O/B equals previous cash C/B", () => {
    const { map } = booksFor([guest("2026-09-01", 10000, "CASH")], "2026-09-02");
    const d1 = map.get("2026-09-01")!;
    const d2 = map.get("2026-09-02")!;
    assert.equal(d1.cashBook.cb, 10000);
    assert.equal(d2.cashBook.ob, 10000);
    assert.equal(d2.cashBook.cb, 10000);
  });

  it("udhaar C/B becomes next outstanding O/B", () => {
    const { map } = booksFor(
      [guest("2026-09-01", 5000, "BALANCE")],
      "2026-09-02",
    );
    const d1 = map.get("2026-09-01")!;
    const d2 = map.get("2026-09-02")!;
    assert.equal(d1.outstanding.cb, 5000);
    assert.equal(d2.outstanding.ob, 5000);
    assert.equal(d2.cashBook.cb, 0);
  });

  it("Santosh QR and P.K. QR carry independently", () => {
    const { map } = booksFor(
      [
        guest("2026-09-01", 2000, "QRS"),
        guest("2026-09-01", 1500, "QRPK"),
      ],
      "2026-09-02",
    );
    const d1 = map.get("2026-09-01")!;
    const d2 = map.get("2026-09-02")!;
    assert.equal(d1.santosh.cb, 2000);
    assert.equal(d1.pk.cb, 1500);
    assert.equal(d2.santosh.ob, 2000);
    assert.equal(d2.pk.ob, 1500);
  });

  it("fills skipped calendar days so a jump still carries C/B", () => {
    const { days, map } = booksFor(
      [guest("2026-09-01", 8000, "CASH")],
      "2026-09-05",
    );
    assert.deepEqual(
      days.map((d) => d.date),
      [
        "2026-09-01",
        "2026-09-02",
        "2026-09-03",
        "2026-09-04",
        "2026-09-05",
      ],
    );
    assert.equal(map.get("2026-09-05")!.cashBook.ob, 8000);
    assert.equal(map.get("2026-09-03")!.cashBook.ob, 8000);
  });

  it("profile opening is day-1 O/B and still carries", () => {
    const { map } = booksFor([], "2026-09-02", {
      opening: { cash: 1200, santosh: 300, pk: 50, online: 0, outstanding: 900 },
    });
    const d1 = map.get("2026-09-01")!;
    const d2 = map.get("2026-09-02")!;
    assert.equal(d1.cashBook.ob, 1200);
    assert.equal(d1.outstanding.ob, 900);
    assert.deepEqual(closeAsPrev(d1), {
      cash: 1200,
      santosh: 300,
      pk: 50,
      online: 0,
      outstanding: 900,
    });
    assert.equal(d2.cashBook.ob, 1200);
    assert.equal(d2.outstanding.ob, 900);
  });

  it("other collection on day 2 cuts outstanding and lifts cash O/B chain", () => {
    const recv: NamedAmount = {
      id: "b1",
      date: "2026-09-02",
      mode: "CASH",
      amount: 2000,
      particular: "Walk-in",
      kind: "other",
    };
    const { map } = booksFor([guest("2026-09-01", 5000, "BALANCE")], "2026-09-03", {
      balReceived: [recv],
    });
    assert.equal(map.get("2026-09-01")!.outstanding.cb, 5000);
    assert.equal(map.get("2026-09-02")!.outstanding.ob, 5000);
    assert.equal(map.get("2026-09-02")!.outstanding.cb, 3000);
    assert.equal(map.get("2026-09-02")!.cashBook.cb, 2000);
    assert.equal(map.get("2026-09-03")!.outstanding.ob, 3000);
    assert.equal(map.get("2026-09-03")!.cashBook.ob, 2000);
  });
});

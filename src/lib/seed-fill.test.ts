import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fillAllSeedDates, fillSeedDate } from "./seed-fill.ts";
import seedJson from "../data/seed.json" with { type: "json" };

describe("fillSeedDate", () => {
  it("replaces a short 6 Sep register so sale becomes ₹57,500", () => {
    const DATE = "2026-09-06";
    const seedGuests = seedJson.guests.filter((g) => g.date === DATE);
    const next = fillSeedDate(seedGuests.slice(0, 17), seedJson.guests, DATE);
    assert.equal(next.filter((g) => g.date === DATE).length, 34);
    assert.equal(
      next.reduce((s, g) => s + g.amount, 0),
      57500,
    );
  });

  it("replaces a fat 9 Sep book left over from yesterday roll", () => {
    const DATE = "2026-09-09";
    const leftover = seedJson.guests
      .filter((g) => g.date === "2026-09-08")
      .map((g) => ({ ...g, id: `old-${g.id}`, date: DATE }));
    const next = fillAllSeedDates(leftover, seedJson.guests);
    assert.equal(next.filter((g) => g.date === DATE).length, 6);
    assert.equal(
      next.filter((g) => g.date === DATE).reduce((s, g) => s + g.amount, 0),
      12000,
    );
    assert.ok(next.every((g) => g.date !== DATE || g.mode === "BALANCE"));
  });

  it("clears leftover 9 Sep food when the chart has none", () => {
    const leftover = [
      { id: "f-x", date: "2026-09-09", mode: "CASH", amount: 500 },
      { id: "f-6", date: "2026-09-06", mode: "QRS", amount: 100 },
    ];
    const next = fillAllSeedDates(leftover, seedJson.food);
    assert.equal(next.filter((r) => r.date === "2026-09-09").length, 0);
    assert.ok(next.some((r) => r.date === "2026-09-06"));
  });

  it("keeps 6–8 Sep when forcing 9 Sep", () => {
    const by = (d: string) => seedJson.guests.filter((g) => g.date === d);
    const next = fillAllSeedDates(
      [...by("2026-09-06"), ...by("2026-09-07"), ...by("2026-09-08")],
      seedJson.guests,
    );
    assert.equal(next.filter((g) => g.date === "2026-09-06").length, 34);
    assert.equal(next.filter((g) => g.date === "2026-09-07").length, 35);
    assert.equal(next.filter((g) => g.date === "2026-09-08").length, 38);
    assert.equal(next.filter((g) => g.date === "2026-09-09").length, 6);
  });
});

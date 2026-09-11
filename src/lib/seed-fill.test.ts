import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fillAllSeedDates, fillSeedDate } from "./seed-fill.ts";
import seedJson from "../data/seed.json" with { type: "json" };

describe("fillSeedDate", () => {
  it("replaces a short 6 Sep register so sale becomes ₹57,500", () => {
    const DATE = "2026-09-06";
    const seedGuests = seedJson.guests.filter((g) => g.date === DATE);
    const partial = seedGuests.slice(0, 17);
    assert.equal(
      partial.reduce((s, g) => s + g.amount, 0),
      31200,
    );
    const next = fillSeedDate(partial, seedJson.guests, DATE);
    assert.equal(next.filter((g) => g.date === DATE).length, 34);
    assert.equal(
      next.reduce((s, g) => s + g.amount, 0),
      57500,
    );
  });

  it("replaces a short 7 Sep register so sale becomes ₹60,300", () => {
    const DATE = "2026-09-07";
    const seedGuests = seedJson.guests.filter((g) => g.date === DATE);
    const next = fillSeedDate(seedGuests.slice(0, 10), seedJson.guests, DATE);
    assert.equal(next.filter((g) => g.date === DATE).length, 35);
    assert.equal(
      next.reduce((s, g) => s + g.amount, 0),
      60300,
    );
    assert.ok(next.some((g) => g.name === "ARBAZ"));
    assert.ok(next.some((g) => g.name === "PAWAN"));
  });

  it("replaces a short 8 Sep register so sale becomes ₹57,200", () => {
    const DATE = "2026-09-08";
    const seedGuests = seedJson.guests.filter((g) => g.date === DATE);
    const next = fillSeedDate(seedGuests.slice(0, 8), seedJson.guests, DATE);
    assert.equal(next.filter((g) => g.date === DATE).length, 38);
    assert.equal(
      next.reduce((s, g) => s + g.amount, 0),
      57200,
    );
    assert.ok(next.some((g) => g.name === "ASHWET"));
  });

  it("replaces a short 9 Sep register so sale becomes ₹12,000", () => {
    const DATE = "2026-09-09";
    const seedGuests = seedJson.guests.filter((g) => g.date === DATE);
    const next = fillSeedDate(seedGuests.slice(0, 2), seedJson.guests, DATE);
    assert.equal(next.filter((g) => g.date === DATE).length, 6);
    assert.equal(
      next.reduce((s, g) => s + g.amount, 0),
      12000,
    );
  });

  it("keeps earlier days when filling 9 Sep", () => {
    const by = (d: string) => seedJson.guests.filter((g) => g.date === d);
    const next = fillAllSeedDates(
      [...by("2026-09-06"), ...by("2026-09-07"), ...by("2026-09-08"), ...by("2026-09-09").slice(0, 1)],
      seedJson.guests,
    );
    assert.equal(next.filter((g) => g.date === "2026-09-06").length, 34);
    assert.equal(next.filter((g) => g.date === "2026-09-07").length, 35);
    assert.equal(next.filter((g) => g.date === "2026-09-08").length, 38);
    assert.equal(next.filter((g) => g.date === "2026-09-09").length, 6);
  });
});

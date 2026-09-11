import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fillSeedDate } from "./seed-fill.ts";
import seedJson from "../data/seed.json" with { type: "json" };

const DATE = "2026-09-06";

describe("fillSeedDate", () => {
  const seedGuests = seedJson.guests.filter((g) => g.date === DATE);

  it("replaces a short 6 Sep register so sale becomes ₹57,500", () => {
    const partial = seedGuests.slice(0, 17);
    assert.equal(
      partial.reduce((s, g) => s + g.amount, 0),
      31200,
    );
    const next = fillSeedDate(partial, seedJson.guests, DATE);
    assert.equal(next.length, 34);
    assert.equal(
      next.reduce((s, g) => s + g.amount, 0),
      57500,
    );
    assert.ok(next.some((g) => g.name === "HARPREET"));
    assert.ok(next.some((g) => g.name === "AKTAR"));
  });

  it("keeps other days when filling 6 Sep", () => {
    const other = {
      id: "g-other",
      date: "2026-09-07",
      slNo: 1,
      name: "TEST",
      roomNo: "101",
      mode: "CASH",
      amount: 1500,
    };
    const next = fillSeedDate([other, ...seedGuests.slice(0, 5)], seedJson.guests, DATE);
    assert.equal(next.filter((g) => g.date === "2026-09-07").length, 1);
    assert.equal(next.filter((g) => g.date === DATE).length, 34);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import seedJson from "../data/seed.json" with { type: "json" };

const DATE = "2026-09-06";

describe("6 Sep day chart seed", () => {
  const guests = seedJson.guests.filter((g) => g.date === DATE);
  const food = seedJson.food.filter((r) => r.date === DATE);
  const ws = seedJson.wholesale.filter((r) => r.date === DATE);
  const exp = seedJson.expenses.filter((r) => r.date === DATE);

  it("posts 34 guests totalling ₹57,500 and skips balance received", () => {
    assert.equal(guests.length, 34);
    assert.equal(
      guests.reduce((s, g) => s + g.amount, 0),
      57500,
    );
    assert.equal(seedJson.balReceived.length, 0);
    assert.ok(guests.some((g) => g.name === "BHASKAR" && g.source === "SPARK"));
    assert.ok(guests.some((g) => g.name === "AKTAR" && g.amount === 3000));
  });

  it("keeps food, walk-in and expenses from the chart", () => {
    assert.equal(
      food.reduce((s, r) => s + r.amount, 0),
      5265,
    );
    assert.equal(
      ws.reduce((s, r) => s + r.amount, 0),
      1050,
    );
    assert.equal(
      exp.reduce((s, r) => s + r.amount, 0),
      9930,
    );
    assert.ok(exp.some((e) => e.particular === "Flysky" && e.amount === 4340));
  });
});

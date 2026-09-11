import { describe, it } from "node:test";
import assert from "node:assert/strict";
import seedJson from "../data/seed.json" with { type: "json" };

const DATE = "2026-09-07";

describe("7 Sep day chart seed", () => {
  const guests = seedJson.guests.filter((g) => g.date === DATE);
  const food = seedJson.food.filter((r) => r.date === DATE);
  const ws = seedJson.wholesale.filter((r) => r.date === DATE);
  const exp = seedJson.expenses.filter((r) => r.date === DATE);

  it("posts 35 guests totalling ₹60,300 and skips balance received", () => {
    assert.equal(guests.length, 35);
    assert.equal(
      guests.reduce((s, g) => s + g.amount, 0),
      60300,
    );
    assert.equal(seedJson.balReceived.length, 0);
    assert.ok(guests.some((g) => g.name === "BHASKAR" && g.roomNo === "111"));
    assert.ok(guests.some((g) => g.name === "PAWAN" && g.amount === 900));
    assert.ok(guests.some((g) => g.name === "AJIT KUMAR" && g.mode === "BALANCE"));
  });

  it("keeps food, walk-in and expenses from the chart", () => {
    assert.equal(
      food.reduce((s, r) => s + r.amount, 0),
      6210,
    );
    assert.equal(
      ws.reduce((s, r) => s + r.amount, 0),
      1880,
    );
    assert.equal(
      exp.reduce((s, r) => s + r.amount, 0),
      15689,
    );
    assert.ok(exp.some((e) => e.particular === "DMART" && e.amount === 5230));
    assert.ok(exp.some((e) => e.particular === "Flysky" && e.amount === 7438));
  });
});

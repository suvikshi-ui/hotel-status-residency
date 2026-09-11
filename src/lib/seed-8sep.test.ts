import { describe, it } from "node:test";
import assert from "node:assert/strict";
import seedJson from "../data/seed.json" with { type: "json" };

const DATE = "2026-09-08";

describe("8 Sep day chart seed", () => {
  const guests = seedJson.guests.filter((g) => g.date === DATE);
  const food = seedJson.food.filter((r) => r.date === DATE);
  const ws = seedJson.wholesale.filter((r) => r.date === DATE);
  const exp = seedJson.expenses.filter((r) => r.date === DATE);

  it("posts 38 guests totalling ₹57,200 and skips balance received", () => {
    assert.equal(guests.length, 38);
    assert.equal(
      guests.reduce((s, g) => s + g.amount, 0),
      57200,
    );
    assert.equal(seedJson.balReceived.length, 0);
    assert.ok(guests.some((g) => g.name === "ABDUL" && g.roomNo === "304"));
    assert.ok(guests.some((g) => g.name === "ASHWET" && g.amount === 1000));
    assert.ok(guests.some((g) => g.name === "ROSHAN" && g.source === "FLYSKY"));
  });

  it("keeps food and expenses from the chart, no walk-in", () => {
    assert.equal(
      food.reduce((s, r) => s + r.amount, 0),
      4870,
    );
    assert.equal(
      ws.reduce((s, r) => s + r.amount, 0),
      0,
    );
    assert.equal(
      exp.reduce((s, r) => s + r.amount, 0),
      9663,
    );
    assert.ok(exp.some((e) => e.particular === "Flysky" && e.amount === 5360));
    assert.ok(
      exp.some((e) => e.particular === "BISLERY JAR AND DUSTBIN BAG" && e.amount === 1050),
    );
  });
});

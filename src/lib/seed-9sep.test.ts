import { describe, it } from "node:test";
import assert from "node:assert/strict";
import seedJson from "../data/seed.json" with { type: "json" };

const DATE = "2026-09-09";

describe("9 Sep day chart seed", () => {
  const guests = seedJson.guests.filter((g) => g.date === DATE);

  it("posts 6 balance guests totalling ₹12,000", () => {
    assert.equal(guests.length, 6);
    assert.equal(
      guests.reduce((s, g) => s + g.amount, 0),
      12000,
    );
    assert.ok(guests.every((g) => g.mode === "BALANCE"));
    assert.ok(guests.some((g) => g.name === "PANKAJ" && g.roomNo === "105"));
    assert.ok(
      guests.some((g) => g.name === "ABDUL" && g.checkIn === "2026-09-06"),
    );
    assert.ok(
      guests.some((g) => g.name === "PANKAJ" && g.checkIn === "2026-09-08"),
    );
    assert.equal(seedJson.balReceived.length, 0);
    assert.equal(
      seedJson.food.filter((r) => r.date === DATE).length,
      0,
    );
    assert.equal(
      seedJson.wholesale.filter((r) => r.date === DATE).length,
      0,
    );
    assert.equal(
      seedJson.expenses.filter((r) => r.date === DATE).length,
      0,
    );
  });
});

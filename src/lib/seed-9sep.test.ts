import { describe, it } from "node:test";
import assert from "node:assert/strict";
import seedJson from "../data/seed.json" with { type: "json" };

const DATE = "2026-09-09";

describe("9 Sep day chart seed", () => {
  const guests = seedJson.guests.filter((g) => g.date === DATE);
  const food = seedJson.food.filter((r) => r.date === DATE);
  const wholesale = seedJson.wholesale.filter((r) => r.date === DATE);
  const expenses = seedJson.expenses.filter((r) => r.date === DATE);

  it("posts 33 guests totalling ₹51,500 and skips balance received", () => {
    assert.equal(guests.length, 33);
    assert.equal(
      guests.reduce((s, g) => s + g.amount, 0),
      51500,
    );
    assert.ok(guests.some((g) => g.name === "DEEPAK" && g.roomNo === "207"));
    assert.ok(guests.some((g) => g.name === "NIKHIL" && g.amount === 3500));
    assert.ok(
      guests.some((g) => g.name === "AJEESHVALI" && g.mode === "ONLINE"),
    );
    assert.ok(guests.some((g) => g.name === "VIKRAM" && g.roomNo === "9"));
    assert.ok(guests.some((g) => g.name === "DIGVIJAY" && g.amount === 2200));
    assert.equal(
      guests.filter((g) => g.stay === "continue").length,
      6,
    );
    assert.equal(seedJson.balReceived.length, 0);
  });

  it("keeps food, walk-in and expenses from the chart", () => {
    assert.equal(
      food.reduce((s, r) => s + r.amount, 0),
      4610,
    );
    assert.equal(
      wholesale.reduce((s, r) => s + r.amount, 0),
      2000,
    );
    assert.equal(
      expenses.reduce((s, r) => s + r.amount, 0),
      54431,
    );
    assert.ok(
      expenses.some(
        (r) => r.particular === "NEW BEDSHEET AND PILLOW" && r.amount === 46563,
      ),
    );
  });
});

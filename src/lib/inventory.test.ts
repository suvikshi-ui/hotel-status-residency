import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  inventoryCheck,
  inventoryCheckLabel,
  inventoryDifference,
  normalizeInventory,
  seedInventory,
  signedCount,
} from "./inventory.ts";

describe("inventory sheet", () => {
  it("seeds the seven linen lines including pillow cover", () => {
    const rows = seedInventory();
    assert.deepEqual(
      rows.map((r) => r.name),
      [
        "Single bed sheet",
        "Double bed sheet",
        "Pillow cover",
        "Towel",
        "Single duvet",
        "Double duvet",
        "Hand towel",
      ],
    );
  });

  it("difference is this month minus last month", () => {
    assert.equal(
      inventoryDifference({ lastMonth: 40, thisMonth: 36 }),
      -4,
    );
    assert.equal(signedCount(-4), "−4");
    assert.equal(signedCount(3), "+3");
  });

  it("says take out when this month is above expected", () => {
    const check = inventoryCheck({ thisMonth: 42, expected: 40 });
    assert.deepEqual(check, { kind: "take-out", qty: 2 });
    assert.equal(inventoryCheckLabel(check), "2 बाहर निकालना पड़ेगा");
  });

  it("says replace when this month is below expected", () => {
    const check = inventoryCheck({ thisMonth: 18, expected: 24 });
    assert.deepEqual(check, { kind: "replace", qty: 6 });
    assert.equal(inventoryCheckLabel(check), "6 रिप्लेस करना पड़ेगा");
  });

  it("says even when this month matches expected", () => {
    const check = inventoryCheck({ thisMonth: 20, expected: 20 });
    assert.equal(check.kind, "even");
    assert.equal(inventoryCheckLabel(check), "बराबर है");
  });

  it("fills pillow cover onto an old save and keeps last month counts", () => {
    const rows = normalizeInventory([
      {
        id: "inv-towel",
        name: "Towel",
        opening: 20,
        received: 0,
        issued: 4,
      },
    ]);
    assert.equal(rows.length >= 7, true);
    const towel = rows.find((r) => r.id === "inv-towel");
    assert.equal(towel?.lastMonth, 20);
    assert.equal(towel?.thisMonth, 16);
    assert.ok(rows.some((r) => r.id === "inv-pillow-cover"));
    assert.ok(rows.some((r) => r.id === "inv-single-sheet"));
  });

  it("keeps extra items added later", () => {
    const rows = normalizeInventory([
      ...seedInventory(),
      {
        id: "inv-blanket",
        name: "Blanket",
        lastMonth: 8,
        thisMonth: 6,
        expected: 8,
      },
    ]);
    const extra = rows.find((r) => r.id === "inv-blanket");
    assert.equal(extra?.lastMonth, 8);
    assert.equal(extra?.thisMonth, 6);
    assert.equal(rows[0]?.id, "inv-single-sheet");
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
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
    assert.equal(towel?.notes, "");
    assert.ok(rows.some((r) => r.id === "inv-pillow-cover"));
    assert.ok(rows.some((r) => r.id === "inv-single-sheet"));
  });

  it("keeps extra items and notes", () => {
    const rows = normalizeInventory([
      ...seedInventory(),
      {
        id: "inv-blanket",
        name: "Blanket",
        lastMonth: 8,
        thisMonth: 6,
        notes: "  2 torn, replace  ",
      },
    ]);
    const extra = rows.find((r) => r.id === "inv-blanket");
    assert.equal(extra?.lastMonth, 8);
    assert.equal(extra?.thisMonth, 6);
    assert.equal(extra?.notes, "2 torn, replace");
    assert.equal(rows[0]?.id, "inv-single-sheet");
  });
});

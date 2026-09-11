import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  inventoryClosing,
  normalizeInventory,
  seedInventory,
} from "./inventory.ts";

describe("inventory sheet", () => {
  it("seeds the six linen lines", () => {
    const rows = seedInventory();
    assert.deepEqual(
      rows.map((r) => r.name),
      [
        "Single bed sheet",
        "Double bed sheet",
        "Towel",
        "Single duvet",
        "Double duvet",
        "Hand towel",
      ],
    );
  });

  it("closing is opening + received − issued", () => {
    assert.equal(
      inventoryClosing({ opening: 40, received: 10, issued: 12 }),
      38,
    );
  });

  it("fills missing catalog items onto an old save", () => {
    const rows = normalizeInventory([
      {
        id: "inv-towel",
        name: "Towel",
        opening: 20,
        received: 0,
        issued: 4,
        laundry: 2,
      },
    ]);
    assert.equal(rows.length >= 6, true);
    const towel = rows.find((r) => r.id === "inv-towel");
    assert.equal(towel?.opening, 20);
    assert.equal(towel?.issued, 4);
    assert.ok(rows.some((r) => r.id === "inv-single-sheet"));
  });

  it("keeps extra items added later", () => {
    const rows = normalizeInventory([
      ...seedInventory(),
      {
        id: "inv-pillow",
        name: "Pillow cover",
        opening: 8,
        received: 2,
        issued: 1,
        laundry: 0,
      },
    ]);
    const extra = rows.find((r) => r.id === "inv-pillow");
    assert.equal(extra?.opening, 8);
    assert.equal(rows[0]?.id, "inv-single-sheet");
  });
});

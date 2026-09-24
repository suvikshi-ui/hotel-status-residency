import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  carryForward,
  decodeInventoryFile,
  encodeInventoryFile,
  inventoryDifference,
  inventoryFileId,
  mergeInventoryFiles,
  normalizeInventory,
  seedBook,
  seedInventory,
  signedCount,
  splitInventoryRows,
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

  it("keeps a saved WS file out of the linen sheet", () => {
    const file = {
      id: inventoryFileId("ws", "2026-09-24"),
      kind: "ws" as const,
      period: "2026-09-24",
      createdAt: "2026-09-24",
      lines: seedBook("ws"),
    };
    const encoded = encodeInventoryFile(file);
    const split = splitInventoryRows([
      ...seedInventory(),
      encoded,
    ]);
    assert.equal(split.files.length, 1);
    assert.equal(split.files[0]?.kind, "ws");
    assert.equal(normalizeInventory(split.items).some((row) => row.id.startsWith("ifile:")), false);
    assert.equal(decodeInventoryFile(encoded)?.period, "2026-09-24");
    const next = carryForward(
      [{ id: "ws-water", name: "Water", lastMonth: 4, thisMonth: 9, notes: "" }],
      seedBook("ws"),
    );
    assert.equal(next[0]?.name, "Water");
    assert.equal(next[0]?.lastMonth, 9);
    assert.equal(next[0]?.thisMonth, 0);
  });

  it("keeps items written on either desk", () => {
    const id = inventoryFileId("ws", "2026-09-24");
    const merged = mergeInventoryFiles(
      [
        {
          id,
          kind: "ws",
          period: "2026-09-24",
          createdAt: "2026-09-24",
          lines: [{ id: "a", name: "Soap", lastMonth: 1, thisMonth: 4, notes: "" }],
        },
      ],
      [
        {
          id,
          kind: "ws",
          period: "2026-09-24",
          createdAt: "2026-09-24",
          lines: [{ id: "b", name: "Bucket", lastMonth: 2, thisMonth: 3, notes: "new" }],
        },
      ],
    );
    const lines = merged[0]?.lines ?? [];
    assert.equal(lines.find((row) => row.name === "Soap")?.thisMonth, 4);
    assert.equal(lines.find((row) => row.name === "Bucket")?.thisMonth, 3);
  });
});

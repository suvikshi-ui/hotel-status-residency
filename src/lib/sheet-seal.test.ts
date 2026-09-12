import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  freezeIfSealed,
  isSealed,
  mergeSealed,
  parseSealedIds,
  sealKey,
  sealedFromHotel,
  unsealedKeys,
  withSealed,
} from "./sheet-seal.ts";

describe("sheet seals", () => {
  it("builds stable keys for Kali / register / inventory", () => {
    assert.equal(sealKey.complaint("c-1"), "c:c-1");
    assert.equal(sealKey.guest("g-1"), "guest:g-1");
    assert.equal(sealKey.inventoryMonth("2026-09-12"), "inv:2026-09");
  });

  it("seals an entry so it cannot change", () => {
    const sealed = withSealed({}, [sealKey.complaint("c-1")]);
    assert.equal(isSealed(sealed, sealKey.complaint("c-1")), true);
    assert.equal(isSealed(sealed, sealKey.complaint("c-2")), false);
    assert.deepEqual(unsealedKeys(["c:c-1", "c:c-2"], sealed), ["c:c-2"]);
    const prev = [{ id: "c-1", note: "AC" }, { id: "c-2", note: "Tap" }];
    const next = [
      { id: "c-1", note: "changed" },
      { id: "c-2", note: "Tap dripping" },
    ];
    assert.deepEqual(freezeIfSealed(prev, next, sealed, sealKey.complaint), [
      { id: "c-1", note: "AC" },
      { id: "c-2", note: "Tap dripping" },
    ]);
  });

  it("keeps hotel json _sealedIds across desks", () => {
    assert.deepEqual(
      sealedFromHotel({ _sealedIds: { "c:c-1": true } }),
      { "c:c-1": true },
    );
    assert.equal(sealedFromHotel({ name: "HSR" }), undefined);
    assert.deepEqual(mergeSealed({ a: true }, { b: true }), { a: true, b: true });
    assert.deepEqual(parseSealedIds(["guest:g-1", ""]), { "guest:g-1": true });
  });
});

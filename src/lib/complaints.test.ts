import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { roomCubeLayout, type RoomComplaint } from "./complaints.ts";

function c(id: string): RoomComplaint {
  return {
    id,
    roomNo: "101",
    note: id,
    level: "yellow",
    createdAt: "2026-09-11",
  };
}

describe("room cube layout", () => {
  it("pads to three empty cubes", () => {
    const { trail, slots } = roomCubeLayout([]);
    assert.equal(trail.length, 0);
    assert.deepEqual(slots, [null, null, null]);
  });

  it("keeps the first two fills on the front row", () => {
    const { trail, slots } = roomCubeLayout([c("1"), c("2")]);
    assert.equal(trail.length, 0);
    assert.equal(slots[0]?.id, "1");
    assert.equal(slots[1]?.id, "2");
    assert.equal(slots[2], null);
  });

  it("shrinks the first cube after the third fill and opens a new front cube", () => {
    const { trail, slots } = roomCubeLayout([c("1"), c("2"), c("3")]);
    assert.deepEqual(trail.map((x) => x.id), ["1"]);
    assert.equal(slots[0]?.id, "2");
    assert.equal(slots[1]?.id, "3");
    assert.equal(slots[2], null);
  });
});

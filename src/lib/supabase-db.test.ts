import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { preferLocalOverCloud } from "./cloud-save.ts";

describe("cloud save", () => {
  it("keeps a just-saved local book instead of an older cloud copy", () => {
    assert.equal(
      preferLocalOverCloud({
        localSavedAt: 2_000,
        cloudUpdatedAt: 1_000,
        localScore: 10,
        cloudScore: 10,
      }),
      true,
    );
  });

  it("loads the cloud book when it is newer", () => {
    assert.equal(
      preferLocalOverCloud({
        localSavedAt: 1_000,
        cloudUpdatedAt: 2_000,
        localScore: 40,
        cloudScore: 10,
      }),
      false,
    );
  });
});

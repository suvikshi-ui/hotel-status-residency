import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canOpenPath, homePath, parseAppRole } from "./roles.ts";

describe("housekeeping role", () => {
  it("defaults unknown values to admin", () => {
    assert.equal(parseAppRole("boss"), "admin");
    assert.equal(parseAppRole("housekeeping"), "housekeeping");
    assert.equal(parseAppRole("staff"), "staff");
  });

  it("opens only the complaint sheet", () => {
    assert.equal(canOpenPath("housekeeping", "/complaints"), true);
    assert.equal(canOpenPath("housekeeping", "/inventory"), false);
    assert.equal(canOpenPath("housekeeping", "/profile"), false);
    assert.equal(canOpenPath("housekeeping", "/register"), false);
    assert.equal(canOpenPath("housekeeping", "/"), false);
  });

  it("lands housekeeping on complaints", () => {
    assert.equal(homePath("housekeeping"), "/complaints");
  });
});

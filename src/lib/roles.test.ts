import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  bottomNavPaths,
  canCountInventory,
  canOpenPath,
  homePath,
  parseAppRole,
  roleAccess,
} from "./roles.ts";

describe("housekeeping role", () => {
  it("defaults unknown values to admin", () => {
    assert.equal(parseAppRole("boss"), "admin");
    assert.equal(parseAppRole("housekeeping"), "housekeeping");
  });

  it("opens complaints and inventory for Kali / housekeeping", () => {
    assert.equal(canOpenPath("housekeeping", "/complaints"), true);
    assert.equal(canOpenPath("housekeeping", "/inventory"), true);
    assert.equal(canOpenPath("housekeeping", "/profile"), true);
    assert.equal(canOpenPath("housekeeping", "/register"), false);
    assert.equal(canOpenPath("housekeeping", "/"), false);
    assert.equal(canCountInventory("housekeeping"), true);
    assert.equal(roleAccess("housekeeping"), "Complaints + Inventory");
    assert.deepEqual(bottomNavPaths("housekeeping"), ["/complaints", "/inventory"]);
  });

  it("lands housekeeping on complaints", () => {
    assert.equal(homePath("housekeeping"), "/complaints");
  });

  it("opens the admin panel for any other role", () => {
    assert.equal(homePath("admin"), "/");
    assert.equal(canOpenPath("admin", "/register"), true);
    assert.equal(canOpenPath("admin", "/"), true);
  });
});

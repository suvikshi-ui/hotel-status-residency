import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { roleFromUsersTable } from "./user-role.ts";

describe("public.users role", () => {
  it("treats only housekeeping as housekeeping", () => {
    assert.equal(roleFromUsersTable("housekeeping"), "housekeeping");
    assert.equal(roleFromUsersTable("admin"), "admin");
    assert.equal(roleFromUsersTable("supervisor"), "admin");
    assert.equal(roleFromUsersTable(undefined), "admin");
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { roleFromUsersTable } from "./user-role.ts";

describe("public.users role", () => {
  it("reads housekeeping, staff and admin from the users table", () => {
    assert.equal(roleFromUsersTable("housekeeping"), "housekeeping");
    assert.equal(roleFromUsersTable("admin"), "admin");
    assert.equal(roleFromUsersTable("supervisor"), "supervisor");
    assert.equal(roleFromUsersTable("staff"), "staff");
    assert.equal(roleFromUsersTable(undefined), "admin");
  });
});
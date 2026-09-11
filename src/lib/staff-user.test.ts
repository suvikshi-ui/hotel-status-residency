import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { authEventReloadsBooks, sameStaffUser, type StaffUser } from "./staff-user.ts";

const a: StaffUser = {
  id: "1",
  email: "a@x.com",
  name: "A",
  username: "a",
  role: "admin",
  ownerId: "1",
};

describe("staff session identity", () => {
  it("does not reload books on token refresh", () => {
    assert.equal(authEventReloadsBooks("TOKEN_REFRESHED"), false);
    assert.equal(authEventReloadsBooks("INITIAL_SESSION"), false);
    assert.equal(authEventReloadsBooks("SIGNED_IN"), true);
    assert.equal(authEventReloadsBooks("SIGNED_OUT"), true);
  });

  it("treats the same user as unchanged", () => {
    assert.equal(sameStaffUser(a, { ...a }), true);
    assert.equal(sameStaffUser(a, { ...a, role: "housekeeping" }), false);
  });
});

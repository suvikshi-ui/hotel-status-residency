import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  loginIsEmail,
  normalizeUsername,
  usernameToEmail,
} from "./hotel-login.ts";

describe("hotel usernames", () => {
  it("normalizes and maps to a login email", () => {
    assert.equal(normalizeUsername("  Maya.HK "), "maya.hk");
    assert.equal(usernameToEmail("Maya.HK"), "maya.hk@status-residency.local");
    assert.equal(loginIsEmail("maya"), false);
    assert.equal(loginIsEmail("owner@hotel.com"), true);
  });
});

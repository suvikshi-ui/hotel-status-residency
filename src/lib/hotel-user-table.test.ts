import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HOUSE_STAFF_PRESETS,
  accessForUser,
  hotelUserFromRow,
  mergeHotelUserLists,
  missingHouseStaff,
} from "./hotel-user-table.ts";

describe("users table", () => {
  it("keeps Kali, House and Housekeeping as housekeeping presets", () => {
    assert.deepEqual(
      HOUSE_STAFF_PRESETS.map((p) => [p.name, p.username, p.role]),
      [
        ["Kali", "kali", "housekeeping"],
        ["House", "house", "housekeeping"],
        ["Housekeeping", "housekeeping", "housekeeping"],
      ],
    );
    assert.equal(accessForUser("housekeeping"), "Complaints + Inventory");
  });

  it("lets public.users win when the same username is in both tables", () => {
    const hotel = [
      hotelUserFromRow({
        id: "h1",
        owner_id: "o",
        name: "Kali",
        username: "kali",
        role: "staff",
      }),
    ];
    const users = [
      hotelUserFromRow({
        id: "u1",
        owner_id: "o",
        name: "Kali",
        username: "kali",
        role: "housekeeping",
      }),
    ];
    const merged = mergeHotelUserLists(users, hotel);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].id, "u1");
    assert.equal(merged[0].role, "housekeeping");
  });

  it("lists Kali House Housekeeping until they are saved", () => {
    const missing = missingHouseStaff([{ username: "kali" }]);
    assert.deepEqual(
      missing.map((p) => p.name),
      ["House", "Housekeeping"],
    );
  });
});

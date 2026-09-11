import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseReportView, REPORT_VIEWS } from "./report-views.ts";

describe("report views", () => {
  it("keeps known views and falls back to daily", () => {
    for (const view of REPORT_VIEWS) {
      assert.equal(parseReportView(view), view);
    }
    assert.equal(parseReportView("nope"), "daily");
    assert.equal(parseReportView(undefined), "daily");
  });
});

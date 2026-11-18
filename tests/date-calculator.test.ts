import assert from "node:assert/strict";
import { test } from "vitest";
import { dateDifference, shiftDate, toInputValue, displayDate } from "@/lib/date-calculator/arithmetic";
test("date differences include leap days and retain backward direction", () => {
  assert.deepEqual(dateDifference("2024-02-28", "2024-03-01"), { days: 2, weeks: "2 days", months: "0 months 2 days" });
  assert.equal(dateDifference("2024-03-01", "2024-02-28").days, -2);
  assert.equal(dateDifference("2025-02-28", "2025-03-01").days, 1);
  assert.equal(dateDifference("2024-01-01", "2024-01-01").days, 0);
});
test("shifts days and weeks across month and year boundaries", () => {
  assert.equal(shiftDate("2024-02-28", 1, "days"), "2024-02-29");
  assert.equal(shiftDate("2024-03-01", -1, "days"), "2024-02-29");
  assert.equal(shiftDate("2024-12-28", 1, "weeks"), "2025-01-04");
  assert.equal(shiftDate("2025-01-04", -1, "weeks"), "2024-12-28");
});
test("month shifts preserve the existing browser calendar overflow semantics", () => {
  assert.equal(shiftDate("2024-01-31", 1, "months"), "2024-03-02");
  assert.equal(shiftDate("2023-01-31", 1, "months"), "2023-03-03");
  assert.equal(shiftDate("2024-03-31", -1, "months"), "2024-03-02");
});
test("Bangkok calendar formatting uses its midnight boundary and UTC shift", () => {
  assert.equal(toInputValue(new Date("2026-10-14T16:59:59Z")), "2026-10-14");
  assert.equal(toInputValue(new Date("2026-10-14T17:00:00Z")), "2026-10-15");
  assert.equal(shiftDate("2026-10-15", 0, "days"), "2026-10-15");
  assert.equal(displayDate("2026-10-15"), "Thu, Oct 15, 2026");
  assert.equal(displayDate("2026-12-02"), "Wed, Dec 2, 2026");
});
test("day differences do not depend on daylight saving time", () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ["Asia/Bangkok", "America/New_York", "Europe/London"]) {
      process.env.TZ = zone;
      assert.equal(dateDifference("2024-03-09", "2024-03-11").days, 2);
      assert.equal(shiftDate("2024-03-10", 1, "days"), "2024-03-11");
    }
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});

test("weeks and months read as calendar words, not decimals", () => {
  assert.deepEqual(dateDifference("2026-11-19", "2026-11-26"), { days: 7, weeks: "1 week", months: "0 months 7 days" });
  assert.deepEqual(dateDifference("2026-11-19", "2026-12-06"), { days: 17, weeks: "2 weeks 3 days", months: "0 months 17 days" });
  assert.equal(dateDifference("2026-01-31", "2026-02-28").months, "1 month 0 days");
  assert.equal(dateDifference("2026-01-15", "2027-03-20").months, "1 year 2 months 5 days");
  assert.equal(dateDifference("2026-01-15", "2027-01-15").months, "1 year 0 days");
  assert.deepEqual(dateDifference("2026-11-26", "2026-11-19"), { days: -7, weeks: "−1 week", months: "−0 months 7 days" });
  assert.equal(dateDifference("2026-11-19", "2026-11-19").weeks, "0 days");
});

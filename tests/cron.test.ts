import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkField, describe as describeCron, fieldMatches, nextRuns, validateCron } from "@/lib/cron/cron";

describe("validateCron", () => {
  it("accepts every preset shape: *, numbers, ranges, lists, steps and range steps", () => {
    for (const expr of ["* * * * *", "0 9 * * 1-5", "*/15 0-23/2 1,15,31 1-12 0,7", "59 23 31 12 7", "5-10/5 * * * *", " 0  0 1 * * "]) {
      expect(validateCron(expr), expr).toEqual({ ok: true });
    }
  });

  it("names the field that is out of range instead of reading it as a time", () => {
    expect(validateCron("0 99 * * *")).toEqual({ ok: false, field: 1, message: "Hour takes 0–23; 99 is out of range." });
    expect(validateCron("60 * * * *")).toMatchObject({ ok: false, field: 0 });
    expect(validateCron("* * 0 * *")).toMatchObject({ ok: false, field: 2, message: "Day of month takes 1–31; 0 is out of range." });
    expect(validateCron("* * 32 * *")).toMatchObject({ ok: false, field: 2 });
    expect(validateCron("* * * 13 *")).toMatchObject({ ok: false, field: 3 });
    expect(validateCron("* * * * 8")).toMatchObject({ ok: false, field: 4 });
  });

  it("checks every item of lists, both ends of ranges and the step", () => {
    expect(validateCron("0 1,25 * * *")).toMatchObject({ ok: false, field: 1, message: "Hour takes 0–23; 25 is out of range." });
    expect(validateCron("0 9-24 * * *")).toMatchObject({ ok: false, field: 1 });
    expect(checkField("*/0", 0)).toBe("Minute step “/0” must be a whole number of 1 or more.");
    expect(checkField("*/x", 0)).toMatch(/step/);
    expect(checkField("1/2/3", 0)).toMatch(/more than one step/);
    // crontab takes a step only after * or a range (Codex review, 2026-11-19).
    expect(checkField("5/20", 0)).toBe("Minute step “5/20” needs * or a range before the /; write 5-59/20 or */20.");
    expect(checkField("1,3/2", 1)).toBe("Hour step “3/2” needs * or a range before the /; write 3-23/2 or */2.");
    expect(checkField("*/20", 0)).toBeNull();
    expect(checkField("5-59/20", 0)).toBeNull();
    expect(validateCron("0 0 1/2 * *")).toEqual({ ok: false, field: 2, message: "Day of month step “1/2” needs * or a range before the /; write 1-31/2 or */2." });
    expect(checkField("5-1", 1)).toMatch(/runs backwards/);
    expect(checkField("1,,2", 1)).toMatch(/empty list item/);
    expect(checkField("MONDAY", 4)).toMatch(/is not a number, range/);
    expect(checkField("MON", 3)).toMatch(/is not a number, range/); // weekday names only in the weekday field
    expect(checkField("JAN", 4)).toMatch(/is not a number, range/);
    expect(checkField("-1", 0)).toMatch(/is not a number, range/);
  });

  it("asks for exactly five fields", () => {
    expect(validateCron("0 9 * *")).toEqual({ ok: false, field: null, message: "A cron expression needs exactly five fields; this one has 4." });
    expect(validateCron("")).toMatchObject({ ok: false, field: null });
  });
});

describe("fieldMatches", () => {
  it("handles lists, ranges, steps and stepped ranges", () => {
    expect(fieldMatches("*", 7, 0, 59)).toBe(true);
    expect(fieldMatches("*/15", 30, 0, 59)).toBe(true);
    expect(fieldMatches("*/15", 31, 0, 59)).toBe(false);
    expect(fieldMatches("1-5", 5, 0, 6)).toBe(true);
    expect(fieldMatches("1-5", 6, 0, 6)).toBe(false);
    expect(fieldMatches("10-20/5", 15, 0, 59)).toBe(true);
    expect(fieldMatches("10-20/5", 25, 0, 59)).toBe(false);
    expect(fieldMatches("5/20", 45, 0, 59)).toBe(true);
    expect(fieldMatches("1,*/30", 30, 0, 59)).toBe(true);
    expect(fieldMatches("1,15", 15, 1, 31)).toBe(true);
    expect(fieldMatches("*/0", 0, 0, 59)).toBe(false);
  });
});

describe("describe and nextRuns", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 16, 8, 0)); });
  afterEach(() => vi.useRealTimers());

  it("explains valid expressions and returns the error sentence for invalid ones", () => {
    expect(describeCron("0 9 * * 1-5")).toBe("at 09:00; every day · all months · weekday 1-5");
    expect(describeCron("*/10 * * * *")).toBe("every 10 minutes; every day · all months · all weekdays");
    expect(describeCron("30 * * * *")).toBe("at minute 30 of every hour; every day · all months · all weekdays");
    expect(describeCron("*/15 9-17 * * *")).toBe("minute */15 of hour 9-17; every day · all months · all weekdays");
    expect(describeCron("0 99 * * *")).toBe("Hour takes 0–23; 99 is out of range.");
  });

  it("spells out minute lists that mix steps and single values, matching the real run times", () => {
    expect(describeCron("*/15,7 * * * *")).toBe("at minutes 0, 7, 15, 30 and 45 of every hour; every day · all months · all weekdays");
    // nextRuns agrees: 08:07, 08:15, 08:30, 08:45, 09:00 after 08:00 (minutes 0, 7, 15, 30, 45).
    // Expected values use the same formatter as nextRuns, so the check holds in any locale and time zone.
    const at = (hour: number, minute: number) => new Date(2026, 10, 16, hour, minute).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    expect(nextRuns("*/15,7 * * * *", 5)).toEqual([at(8, 7), at(8, 15), at(8, 30), at(8, 45), at(9, 0)]);
    expect(describeCron("0,30 * * * *")).toBe("at minutes 0 and 30 of every hour; every day · all months · all weekdays");
    expect(describeCron("5-7 * * * *")).toBe("at minutes 5, 6 and 7 of every hour; every day · all months · all weekdays");
    expect(describeCron("10-50/40 * * * *")).toBe("at minutes 10 and 50 of every hour; every day · all months · all weekdays");
    expect(describeCron("59-59/5 * * * *")).toBe("at minute 59 of every hour; every day · all months · all weekdays");
    expect(describeCron("*/2,1 * * * *")).toBe("at 31 minutes (0, 1, 2, 4, 6 … 58) of every hour; every day · all months · all weekdays");
  });

  it("finds no runs for an invalid expression and treats weekday 7 as Sunday", () => {
    expect(nextRuns("0 99 * * *")).toEqual([]);
    expect(nextRuns("0 9 * *")).toEqual([]);
    const sundays = nextRuns("0 12 * * 7", 3);
    expect(sundays).toEqual(nextRuns("0 12 * * 0", 3));
    expect(sundays).toHaveLength(3);
    expect(nextRuns("0 9 * * 1-5", 5)).toHaveLength(5);
  });
});

// crontab takes month and weekday names, case-insensitive, alone, in lists and in ranges (Codex review, 2026-11-19).
describe("month and weekday names", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 16, 8, 0)); }); // Monday 16 Nov 2026
  afterEach(() => vi.useRealTimers());
  const at = (month: number, day: number, hour: number, minute: number) => new Date(2026, month, day, hour, minute).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

  it("accepts JAN–DEC and SUN–SAT in any case, in lists and ranges", () => {
    for (const expr of ["0 9 * * MON-FRI", "0 9 * * mon-fri", "0 9 * * Sun,sat", "0 0 1 JAN,jul *", "0 0 1 mar-May *", "0 9 * * MON-FRI/2", "0 9 * * 1-FRI"]) {
      expect(validateCron(expr), expr).toEqual({ ok: true });
    }
    expect(checkField("SUN-SAT", 4)).toBeNull();
    expect(checkField("FRI-MON", 4)).toMatch(/runs backwards/);
    expect(checkField("MON/2", 4)).toMatch(/needs \* or a range/);
  });

  it("runs on the named days and months", () => {
    expect(nextRuns("0 9 * * MON-FRI", 3)).toEqual([at(10, 16, 9, 0), at(10, 17, 9, 0), at(10, 18, 9, 0)]);
    expect(nextRuns("0 9 * * sat,SUN", 2)).toEqual([at(10, 21, 9, 0), at(10, 22, 9, 0)]);
    expect(nextRuns("0 0 1 jan *", 1)).toEqual([new Date(2027, 0, 1, 0, 0).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })]);
    expect(nextRuns("0 9 * * MON-FRI", 3)).toEqual(nextRuns("0 9 * * 1-5", 3));
  });

  it("describes them in plain English", () => {
    expect(describeCron("0 9 * * MON-FRI")).toBe("at 09:00; every day · all months · weekday MON-FRI");
    expect(describeCron("0 0 1 JAN *")).toBe("at 00:00; day 1 · month JAN · all weekdays");
  });
});

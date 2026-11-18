import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkField, describe as describeCron, fieldMatches, localZoneLabel, nextRunDates, nextRuns, runLabels, validateCron } from "@/lib/cron/cron";

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
    expect(describeCron("0 9 * * 1-5")).toBe("At 09:00, Monday to Friday");
    expect(describeCron("*/10 * * * *")).toBe("Every 10 minutes");
    expect(describeCron("30 * * * *")).toBe("At minute 30 of every hour, every day");
    expect(describeCron("* * * * *")).toBe("Every minute");
    expect(describeCron("0 0 1 * *")).toBe("At 00:00, on day 1");
    expect(describeCron("*/15 9-17 * * *")).toBe("Every 15 minutes from 09:00 to 17:59");
    expect(describeCron("0 99 * * *")).toBe("Hour takes 0–23; 99 is out of range.");
  });

  it("spells out minute lists that mix steps and single values, matching the real run times", () => {
    expect(describeCron("*/15,7 * * * *")).toBe("At minutes 0, 7, 15, 30 and 45 of every hour, every day");
    // nextRuns agrees: 08:07, 08:15, 08:30, 08:45, 09:00 after 08:00 (minutes 0, 7, 15, 30, 45).
    // Expected values use the same formatter as nextRuns, so the check holds in any locale and time zone.
    const at = (hour: number, minute: number) => new Date(2026, 10, 16, hour, minute).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    expect(nextRuns("*/15,7 * * * *", 5)).toEqual([at(8, 7), at(8, 15), at(8, 30), at(8, 45), at(9, 0)]);
    expect(describeCron("0,30 * * * *")).toBe("At minutes 0 and 30 of every hour, every day");
    expect(describeCron("5-7 * * * *")).toBe("At minutes 5, 6 and 7 of every hour, every day");
    expect(describeCron("10-50/40 * * * *")).toBe("At minutes 10 and 50 of every hour, every day");
    expect(describeCron("59-59/5 * * * *")).toBe("At minute 59 of every hour, every day");
    expect(describeCron("*/2,1 * * * *")).toBe("At 31 minutes (0, 1, 2, 4, 6 … 58) of every hour, every day");
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
    expect(describeCron("0 9 * * MON-FRI")).toBe("At 09:00, Monday to Friday");
    expect(describeCron("0 0 1 JAN *")).toBe("At 00:00, on day 1 in January");
    expect(describeCron("0 0 1 jan-MAR,jul *")).toBe("At 00:00, on day 1 in January to March and July");
  });
});

// Both day fields restricted: crontab runs when EITHER matches (Codex review, 2026-11-19).
describe("day of month OR weekday", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 16, 8, 0)); }); // Monday 16 Nov 2026
  afterEach(() => vi.useRealTimers());
  const at = (month: number, day: number) => new Date(2026, month, day, 9, 0).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

  it("runs on day 1 and on every Monday when both are set", () => {
    // Mondays 16, 23, 30 Nov, then Tue 1 Dec (day 1), then Monday 7 Dec.
    expect(nextRuns("0 9 1 * MON", 5)).toEqual([at(10, 16), at(10, 23), at(10, 30), at(11, 1), at(11, 7)]);
    expect(nextRuns("0 9 1 * 1", 5)).toEqual(nextRuns("0 9 1 * MON", 5));
  });

  it("keeps AND when either day field starts with *", () => {
    // A * day field (or one starting with *) leaves the other field in charge.
    expect(nextRuns("0 9 1 * *", 1)).toEqual([at(11, 1)]);
    expect(nextRuns("0 9 * * MON", 2)).toEqual([at(10, 16), at(10, 23)]);
    expect(nextRuns("0 9 */1 * MON", 2)).toEqual([at(10, 16), at(10, 23)]);
  });

  it("says or in the description", () => {
    expect(describeCron("0 9 1 * MON")).toBe("At 09:00, on day 1 or on Monday");
    expect(describeCron("0 9 1,15 * 1-5")).toBe("At 09:00, on days 1 and 15 or on Monday to Friday");
    expect(describeCron("0 9 1 JAN sun,SAT")).toBe("At 09:00, on day 1 or on Saturday and Sunday in January");
    expect(describeCron("0 9 * * MON")).toBe("At 09:00, on Monday");
    // 0-7/3 is 0, 3, 6 (Sunday, Wednesday, Saturday), not "Sunday to Sunday every 3 days" (Codex review, 2026-11-19).
    expect(describeCron("0 9 1 * 0-7/3")).toBe("At 09:00, on day 1 or on Wednesday, Saturday and Sunday");
  });

  it("does not treat non-ASCII look-alikes as names", () => {
    expect(validateCron("0 9 * * \u017Fun").ok).toBe(false);
  });
});

// The description is built from the same day sets nextRuns uses, so the two always agree (Codex review, 2026-11-19).
describe("describe agrees with nextRuns", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 16, 8, 0)); });
  afterEach(() => vi.useRealTimers());
  const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  /** Weekday names in a description, in the order they appear. */
  const namesIn = (text: string) => NAMES.filter((name) => text.includes(name));
  /** Expand "A to B" weekday ranges in Monday-first order, the order describe() uses. */
  const expand = (text: string) => {
    const order = [1, 2, 3, 4, 5, 6, 0];
    const out = new Set(namesIn(text));
    for (const [, from, to] of text.matchAll(/(\w+day) to (\w+day)/g)) {
      let at = order.indexOf(NAMES.indexOf(from));
      while (order[at % 7] !== NAMES.indexOf(to)) { out.add(NAMES[order[at % 7]]); at += 1; }
      out.add(to);
    }
    return out;
  };

  for (const expr of ["0 9 1 * 0-7/3", "0 9 15 * 1-5", "0 9 1,15 * SAT,7", "0 9 10 * */2", "0 9 1-3 * 5-7", "0 9 * * 0-7/3", "0 9 */1 * 2-4", "30 6 * * 6,0"]) {
    it(`${expr}: the weekdays named are the weekdays it runs on, beside its days of month`, () => {
      const [, , dom] = expr.split(" ");
      const runs = nextRunDates(expr, 120);
      const domDays = new Set<number>();
      const domMatches = (day: number) => fieldMatches(dom, day, 1, 31);
      for (const run of runs) if (domMatches(run.getDate())) domDays.add(run.getDate());
      const either = !dom.startsWith("*") && !expr.split(" ")[4].startsWith("*");
      // With the OR rule, a run on a day outside the day-of-month list ran because of its weekday.
      const weekdayRuns = new Set(runs.filter((run) => !either || !domMatches(run.getDate())).map((run) => NAMES[run.getDay()]));
      const text = describeCron(expr);
      expect(expand(text), text).toEqual(weekdayRuns);
    });
  }

  it("lists UTC run times and names the local zone", () => {
    expect(nextRuns("0 9 * * *", 2, { utc: true })).toHaveLength(2);
    for (const date of nextRunDates("0 9 * * *", 3, { utc: true })) expect(date.getUTCHours()).toBe(9);
    expect(localZoneLabel()).toMatch(/\(UTC([+−]\d+(:\d{2})?)?\)$/);
  });
});

// Codex review, 2026-11-19 (second round).
describe("time zones, clock changes and hourly steps", () => {
  const zone = process.env.TZ;
  beforeEach(() => { process.env.TZ = "America/New_York"; vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); process.env.TZ = zone; });

  it("UTC mode starts at the next whole UTC minute, also where local time is not UTC", () => {
    vi.setSystemTime(new Date("2026-11-01T06:10:30Z"));
    expect(nextRunDates("* * * * *", 1, { utc: true })[0].toISOString()).toBe("2026-11-01T06:11:00.000Z");
    expect(nextRunDates("0 9 * * *", 1, { utc: true })[0].toISOString()).toBe("2026-11-01T09:00:00.000Z");
  });

  it("two runs at the same local time (daylight saving ends) get distinct labels and keys", () => {
    vi.setSystemTime(new Date("2026-10-31T12:00:00Z"));
    const dates = nextRunDates("30 1 * * *", 2);
    expect(dates.map((date) => date.toISOString())).toEqual(["2026-11-01T05:30:00.000Z", "2026-11-01T06:30:00.000Z"]);
    const runs = runLabels(dates);
    expect(new Set(runs.map((run) => run.label)).size).toBe(2);
    expect(new Set(runs.map((run) => run.key)).size).toBe(2);
    expect(runs[0].label).toMatch(/GMT-4/);
    expect(runs[1].label).toMatch(/GMT-5/);
  });

  it("names the zone with the first run's own offset and marks later runs past a clock change", () => {
    vi.setSystemTime(new Date("2026-10-30T12:00:00Z")); // EDT now; the runs below straddle the change on 1 Nov
    const dates = nextRunDates("0 12 * * *", 4);
    expect(localZoneLabel(dates[0])).toBe("America/New_York (UTC−4)");
    expect(localZoneLabel(dates[3])).toBe("America/New_York (UTC−5)");
    const runs = runLabels(dates);
    expect(runs[0].label).not.toMatch(/GMT/);
    expect(runs[3].label).toMatch(/GMT-5/);
  });
});

describe("steps that restart every hour", () => {
  it("only says every N minutes when N divides 60", () => {
    expect(describeCron("*/40 9-10 * * *")).toBe("At 09:00, 09:40, 10:00 and 10:40, every day");
    expect(describeCron("*/40 * * * *")).toBe("At minutes 0 and 40 of every hour, every day");
    expect(describeCron("*/20 9-10 * * *")).toBe("Every 20 minutes from 09:00 to 10:59");
  });
});

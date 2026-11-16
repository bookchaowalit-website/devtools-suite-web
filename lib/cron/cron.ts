/** Standard five-field cron helpers. Next runs use the viewer's clock: call them in the browser only. */

/** Allowed values per field, in field order. Weekday accepts 0 and 7 for Sunday. */
export const FIELD_RANGES = [
  { name: "minute", label: "Minute", min: 0, max: 59 },
  { name: "hour", label: "Hour", min: 0, max: 23 },
  { name: "day", label: "Day of month", min: 1, max: 31 },
  { name: "month", label: "Month", min: 1, max: 12 },
  { name: "weekday", label: "Weekday", min: 0, max: 7 },
] as const;

export type CronCheck = { ok: true } | { ok: false; field: number | null; message: string };

const NUMBER = /^\d+$/;

/** Checks one field (lists, ranges, steps, *) against its range; returns an error sentence or null. */
export function checkField(text: string, index: number): string | null {
  const { label, min, max } = FIELD_RANGES[index];
  const allowed = `${label} takes ${min}–${max}`;
  for (const part of text.split(",")) {
    if (part === "") return `${label} has an empty list item in “${text}”.`;
    const pieces = part.split("/");
    if (pieces.length > 2) return `${label} “${part}” has more than one step (/).`;
    const [range, step] = pieces;
    if (step !== undefined && (!NUMBER.test(step) || Number(step) < 1)) return `${label} step “/${step}” must be a whole number of 1 or more.`;
    if (range === "*") continue;
    const ends = range.split("-");
    if (ends.length > 2 || ends.some((end) => !NUMBER.test(end))) return `${label} “${part}” is not a number, range (1-5), list (1,15) or step (*/10).`;
    for (const end of ends) if (Number(end) < min || Number(end) > max) return `${allowed}; ${end} is out of range.`;
    if (ends.length === 2 && Number(ends[0]) > Number(ends[1])) return `${label} range “${range}” runs backwards; write the smaller number first.`;
  }
  return null;
}

/** Validates a whole expression: exactly five fields, each inside its range. */
export function validateCron(expr: string): CronCheck {
  const parts = expr.trim().split(/\s+/).filter(Boolean);
  if (parts.length !== 5) return { ok: false, field: null, message: `A cron expression needs exactly five fields; this one has ${parts.length}.` };
  for (let index = 0; index < 5; index += 1) {
    const message = checkField(parts[index], index);
    if (message) return { ok: false, field: index, message };
  }
  return { ok: true };
}

export function fieldMatches(field: string, value: number, min: number, max: number): boolean {
  return field.split(",").some((part) => {
    const [range, stepText] = part.split("/");
    const step = stepText === undefined ? 1 : Number(stepText);
    if (!step) return false;
    const [a, b] = range === "*" ? [min, max] : range.split("-").map(Number);
    const end = b ?? (stepText === undefined ? a : max);
    return value >= a && value <= end && (value - a) % step === 0;
  });
}

export function describe(expr: string) {
  const check = validateCron(expr);
  if (!check.ok) return check.message;
  const [minute, hour, dom, month, dow] = expr.trim().split(/\s+/);
  const plain = (field: string) => NUMBER.test(field);
  const time = minute === "*" && hour === "*" ? "every minute"
    : minute.startsWith("*/") && hour === "*" ? `every ${minute.slice(2)} minutes`
    : plain(minute) && hour === "*" ? `at minute ${minute} of every hour`
    : plain(minute) && plain(hour) ? `at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
    : `minute ${minute} of hour ${hour}`;
  const dates = [dom !== "*" ? `day ${dom}` : "every day", month !== "*" ? `month ${month}` : "all months", dow !== "*" ? `weekday ${dow}` : "all weekdays"];
  return `${time}; ${dates.join(" · ")}`;
}

export function nextRuns(expr: string, count = 5) {
  if (!validateCron(expr).ok) return [];
  const parts = expr.trim().split(/\s+/);
  const [minute, hour, dom, month, dow] = parts;
  const cursor = new Date(); cursor.setSeconds(0, 0); cursor.setMinutes(cursor.getMinutes() + 1);
  const runs: string[] = [];
  for (let i = 0; i < 60 * 24 * 400 && runs.length < count; i += 1) {
    const weekday = cursor.getDay();
    if (fieldMatches(minute, cursor.getMinutes(), 0, 59) && fieldMatches(hour, cursor.getHours(), 0, 23) && fieldMatches(dom, cursor.getDate(), 1, 31) && fieldMatches(month, cursor.getMonth() + 1, 1, 12) && (fieldMatches(dow, weekday, 0, 7) || (weekday === 0 && dow !== "*" && fieldMatches(dow, 7, 0, 7)))) runs.push(cursor.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return runs;
}

export const PRESETS: readonly (readonly [string, string])[] = [
  ["Every minute", "* * * * *"], ["Hourly", "0 * * * *"], ["Weekdays · 09:00", "0 9 * * 1-5"], ["Monday · 09:00", "0 9 * * 1"], ["First of month", "0 0 1 * *"],
];
export const FIELDS = ["minute", "hour", "day", "month", "weekday"];

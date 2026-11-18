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
  // "every N minutes" only when the whole field is one */N step; a list such as */15,7 is spelled out instead.
  const time = minute === "*" && hour === "*" ? "every minute"
    : /^\*\/\d+$/.test(minute) && hour === "*" ? `every ${minute.slice(2)} minutes`
    : plain(minute) && hour === "*" ? `at minute ${minute} of every hour`
    : hour === "*" ? `at ${minuteList(minute)} of every hour`
    : plain(minute) && plain(hour) ? `at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
    : `minute ${minute} of hour ${hour}`;
  const dates = [dom !== "*" ? `day ${dom}` : "every day", month !== "*" ? `month ${month}` : "all months", dow !== "*" ? `weekday ${dow}` : "all weekdays"];
  return `${time}; ${dates.join(" · ")}`;
}

/** The minutes a minute field really runs on, from the same matcher nextRuns uses, e.g. "minutes 0, 7, 15, 30 and 45". */
function minuteList(field: string): string {
  const values: number[] = [];
  for (let value = 0; value <= 59; value += 1) if (fieldMatches(field, value, 0, 59)) values.push(value);
  if (values.length === 1) return `minute ${values[0]}`;
  if (values.length <= 12) return `minutes ${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
  return `${values.length} minutes (${values.slice(0, 5).join(", ")} … ${values[values.length - 1]})`;
}

/** Expands a field once into a lookup table indexed by value, so the minute loop does no parsing. */
function allowedValues(field: string, min: number, max: number): boolean[] {
  const table: boolean[] = [];
  for (let value = min; value <= max; value += 1) table[value] = fieldMatches(field, value, min, max);
  return table;
}

export function nextRuns(expr: string, count = 5) {
  if (!validateCron(expr).ok) return [];
  const [minute, hour, dom, month, dow] = expr.trim().split(/\s+/);
  const minutes = allowedValues(minute, 0, 59);
  const hours = allowedValues(hour, 0, 23);
  const days = allowedValues(dom, 1, 31);
  const months = allowedValues(month, 1, 12);
  const weekdays = allowedValues(dow, 0, 7);
  if (dow !== "*" && weekdays[7]) weekdays[0] = true;
  const cursor = new Date(); cursor.setSeconds(0, 0); cursor.setMinutes(cursor.getMinutes() + 1);
  const runs: string[] = [];
  for (let i = 0; i < 60 * 24 * 400 && runs.length < count; i += 1) {
    if (minutes[cursor.getMinutes()] && hours[cursor.getHours()] && days[cursor.getDate()] && months[cursor.getMonth() + 1] && weekdays[cursor.getDay()]) runs.push(cursor.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return runs;
}

export const PRESETS: readonly (readonly [string, string])[] = [
  ["Every minute", "* * * * *"], ["Hourly", "0 * * * *"], ["Weekdays · 09:00", "0 9 * * 1-5"], ["Monday · 09:00", "0 9 * * 1"], ["First of month", "0 0 1 * *"],
];
export const FIELDS = ["minute", "hour", "day", "month", "weekday"];

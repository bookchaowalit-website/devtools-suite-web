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

/** Names crontab accepts, case-insensitive: JAN–DEC in the month field (1–12), SUN–SAT in the weekday field (0–6). */
const NAMES: Partial<Record<number, readonly string[]>> = {
  3: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
  4: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
};

/** One end of a range as a number string: a month or weekday name becomes its number, anything else is unchanged. */
function nameToNumber(end: string, index: number): string {
  const names = NAMES[index];
  // ASCII letters only, the same rule numericField uses (toUpperCase would turn "ſun" into "SUN").
  const at = names && /^[A-Za-z]+$/.test(end) ? names.indexOf(end.toUpperCase()) : -1;
  return at === -1 ? end : String(index === 3 ? at + 1 : at);
}

/** A field with every month or weekday name replaced by its number, so the matcher only sees numbers. */
function numericField(field: string, index: number): string {
  return NAMES[index] ? field.replace(/[A-Za-z]+/g, (name) => nameToNumber(name, index)) : field;
}

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
    const ends = range.split("-").map((end) => nameToNumber(end, index));
    if (ends.length > 2 || ends.some((end) => !NUMBER.test(end))) return `${label} “${part}” is not a number, range (1-5), list (1,15) or step (*/10).`;
    for (const end of ends) if (Number(end) < min || Number(end) > max) return `${allowed}; ${end} is out of range.`;
    // Standard crontab allows a step only after * or a range: 5/20 is refused by crontab, so refuse it here too.
    if (step !== undefined && ends.length === 1) return `${label} step “${part}” needs * or a range before the /; write ${range}-${max}/${step} or */${step}.`;
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

/**
 * The expression in plain English, e.g. "At 09:00, Monday to Friday". Every phrase is built from the values the
 * same matcher as nextRuns() accepts (names, steps, 7 = Sunday and the day-of-month OR weekday rule included),
 * so the description always agrees with the run times.
 */
export function describe(expr: string) {
  const check = validateCron(expr);
  if (!check.ok) return check.message;
  const raw = expr.trim().split(/\s+/);
  const [minute, hour, dom, month, dow] = raw.map(numericField);
  const minutes = matching(minute, 0, 59);
  const hours = matching(hour, 0, 23);
  const days = matching(dom, 1, 31);
  const months = matching(month, 1, 12);
  const weekdays = weekdaySet(dow);

  const time = timePhrase(minute, minutes, hours);
  const allDays = days.length === 31;
  const allWeekdays = weekdays.length === 7;
  let dayPart: string;
  if (eitherDay(raw[2], raw[4])) {
    // crontab runs on a day when the day of month OR the weekday matches.
    dayPart = allDays || allWeekdays ? "every day" : `${dayPhrase(days)} or on ${weekdayWords(weekdays)}`;
  } else if (allDays && allWeekdays) {
    dayPart = "every day";
  } else if (allDays) {
    dayPart = weekdayPhrase(weekdays);
  } else if (allWeekdays) {
    dayPart = dayPhrase(days);
  } else {
    dayPart = `${dayPhrase(days)}, when that day is a ${weekdayWords(weekdays, "or")}`;
  }
  const monthPart = months.length === 12 ? "" : ` in ${runList(months, (value) => MONTH_NAMES[value - 1])}`;
  if (dayPart === "every day" && time.startsWith("Every")) return `${time}${monthPart}`;
  return `${time}, ${dayPart}${monthPart}`;
}

/** crontab (Vixie/cronie) rule: when neither day field starts with *, a day runs if day-of-month OR weekday matches. */
function eitherDay(dom: string, dow: string): boolean {
  return !dom.startsWith("*") && !dow.startsWith("*");
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (value: number) => String(value).padStart(2, "0");

/** Every value in min..max that a (numeric) field matches, from the matcher nextRuns uses. */
function matching(field: string, min: number, max: number): number[] {
  const values: number[] = [];
  for (let value = min; value <= max; value += 1) if (fieldMatches(field, value, min, max)) values.push(value);
  return values;
}

/** Weekdays a field matches, 7 folded into 0 (Sunday), in Monday-first order so "1-5" reads Monday to Friday. */
function weekdaySet(field: string): number[] {
  const set = new Set(matching(field, 0, 7).map((value) => value % 7));
  return [1, 2, 3, 4, 5, 6, 0].filter((value) => set.has(value));
}

/** Runs of three or more consecutive values become "A to B"; the rest are listed: "1, 15 and 20 to 25". */
function runList(values: number[], name: (value: number) => string, last = "and", next = (value: number) => value + 1): string {
  const parts: string[] = [];
  for (let index = 0; index < values.length;) {
    let end = index;
    while (end + 1 < values.length && values[end + 1] === next(values[end])) end += 1;
    if (end - index >= 2) parts.push(`${name(values[index])} to ${name(values[end])}`);
    else for (let at = index; at <= end; at += 1) parts.push(name(values[at]));
    index = end + 1;
  }
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} ${last} ${parts[parts.length - 1]}`;
}

const nextWeekday = (value: number) => (value + 1) % 7;
const weekdayWords = (values: number[], last = "and") => runList(values, (value) => WEEKDAY_NAMES[value], last, nextWeekday);
/** "Monday to Friday" reads on its own; a single day or a list takes "on": "on Monday", "on Sunday, Wednesday and Saturday". */
function weekdayPhrase(values: number[]): string {
  const words = weekdayWords(values);
  return /^\w+ to \w+$/.test(words) ? words : `on ${words}`;
}

function dayPhrase(values: number[]): string {
  if (values.length > 10 && runList(values, String).includes(",")) return `on ${values.length} days of the month (${values.slice(0, 4).join(", ")} … ${values[values.length - 1]})`;
  return `on ${values.length === 1 ? "day" : "days"} ${runList(values, String)}`;
}

function timePhrase(minuteField: string, minutes: number[], hours: number[]): string {
  const everyHour = hours.length === 24;
  const step = /^\*\/(\d+)$/.exec(minuteField);
  const hourWindow = () => {
    const contiguous = hours[hours.length - 1] - hours[0] === hours.length - 1;
    return contiguous ? `from ${pad(hours[0])}:00 to ${pad(hours[hours.length - 1])}:59` : `during hours ${runList(hours, String)}`;
  };
  if (minutes.length === 60) return everyHour ? "Every minute" : `Every minute ${hourWindow()}`;
  // */N restarts at minute 0 every hour, so it is only "every N minutes" when N divides 60 (*/40 runs at :00 and :40).
  if (step && 60 % Number(step[1]) === 0) return everyHour ? `Every ${step[1]} minutes` : `Every ${step[1]} minutes ${hourWindow()}`;
  if (everyHour) return minutes.length === 1 ? `At minute ${minutes[0]} of every hour` : `At ${minuteList(minutes)} of every hour`;
  if (minutes.length * hours.length <= 6) {
    const times = hours.flatMap((h) => minutes.map((m) => `${pad(h)}:${pad(m)}`));
    return `At ${times.length === 1 ? times[0] : `${times.slice(0, -1).join(", ")} and ${times[times.length - 1]}`}`;
  }
  return `At ${minutes.length === 1 ? `minute ${minutes[0]}` : minuteList(minutes)} past each hour ${hourWindow()}`;
}

/** The minutes a minute field really runs on, e.g. "minutes 0, 7, 15, 30 and 45". */
function minuteList(values: number[]): string {
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

/** The time zone the browser runs in, e.g. "Asia/Bangkok (UTC+7)". */
export function localZoneLabel(date = new Date()): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "−";
  const hoursPart = Math.floor(Math.abs(offset) / 60);
  const minutesPart = Math.abs(offset) % 60;
  return `${zone} (UTC${offset === 0 ? "" : `${sign}${hoursPart}${minutesPart ? `:${pad(minutesPart)}` : ""}`})`;
}

/** Next run times as display strings, in the browser's time zone or, with `{ utc: true }`, in UTC as servers often run cron. */
export function nextRuns(expr: string, count = 5, { utc = false }: { utc?: boolean } = {}): string[] {
  return runLabels(nextRunDates(expr, count, { utc }), { utc }).map((run) => run.label);
}

/**
 * Display labels for run instants, keyed by timestamp. When a clock change makes two runs read the same local time
 * (01:30 twice as daylight saving ends), both labels gain their UTC offset so they can be told apart; so does any run
 * whose offset differs from the first run's.
 */
export function runLabels(dates: Date[], { utc = false }: { utc?: boolean } = {}): { key: number; label: string }[] {
  const base: Intl.DateTimeFormatOptions = utc ? { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" } : { dateStyle: "medium", timeStyle: "short" };
  const labels = dates.map((date) => date.toLocaleString([], base));
  // The heading names the zone with the first run's offset; a later run on the other side of a clock change
  // (or a repeated local time) shows its own offset, worked out for its own date.
  const firstOffset = dates[0]?.getTimezoneOffset();
  return dates.map((date, index) => {
    const repeated = !utc && (labels.some((label, other) => other !== index && label === labels[index]) || date.getTimezoneOffset() !== firstOffset);
    const zone = repeated ? ` (${new Intl.DateTimeFormat([], { timeZoneName: "shortOffset", hour: "numeric" }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? "local"})` : "";
    return { key: date.getTime(), label: labels[index] + zone };
  });
}

export function nextRunDates(expr: string, count = 5, { utc = false }: { utc?: boolean } = {}): Date[] {
  if (!validateCron(expr).ok) return [];
  const [minute, hour, dom, month, dow] = expr.trim().split(/\s+/).map(numericField);
  const minutes = allowedValues(minute, 0, 59);
  const hours = allowedValues(hour, 0, 23);
  const days = allowedValues(dom, 1, 31);
  const months = allowedValues(month, 1, 12);
  const weekdays = allowedValues(dow, 0, 7);
  if (dow !== "*" && weekdays[7]) weekdays[0] = true;
  const either = eitherDay(dom, dow);
  // Start at the next whole minute of the timestamp itself: setMinutes() works in local time, which is wrong for UTC.
  const cursor = new Date(Math.floor(Date.now() / 60_000) * 60_000 + 60_000);
  const at = utc
    ? { minute: () => cursor.getUTCMinutes(), hour: () => cursor.getUTCHours(), date: () => cursor.getUTCDate(), day: () => cursor.getUTCDay(), month: () => cursor.getUTCMonth() }
    : { minute: () => cursor.getMinutes(), hour: () => cursor.getHours(), date: () => cursor.getDate(), day: () => cursor.getDay(), month: () => cursor.getMonth() };
  const runs: Date[] = [];
  for (let i = 0; i < 60 * 24 * 400 && runs.length < count; i += 1) {
    const dayOk = either ? days[at.date()] || weekdays[at.day()] : days[at.date()] && weekdays[at.day()];
    if (minutes[at.minute()] && hours[at.hour()] && dayOk && months[at.month() + 1]) runs.push(new Date(cursor));
    cursor.setTime(cursor.getTime() + 60_000);
  }
  return runs;
}

export const PRESETS: readonly (readonly [string, string])[] = [
  ["Every minute", "* * * * *"], ["Hourly", "0 * * * *"], ["Weekdays · 09:00", "0 9 * * 1-5"], ["Monday · 09:00", "0 9 * * 1"], ["First of month", "0 0 1 * *"],
];
export const FIELDS = ["minute", "hour", "day", "month", "weekday"];

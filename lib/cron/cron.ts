/** Standard five-field cron helpers. Next runs use the viewer's clock: call them in the browser only. */

export function fieldMatches(field: string, value: number, min: number, max: number): boolean {
  if (field === "*") return true;
  if (field.includes("/")) { const [base, stepText] = field.split("/"); const step = Number(stepText); const start = base === "*" ? min : Number(base); return Boolean(step) && value >= start && (value - start) % step === 0; }
  if (field.includes(",")) return field.split(",").some((part) => fieldMatches(part, value, min, max));
  if (field.includes("-")) { const [a, b] = field.split("-").map(Number); return value >= a && value <= b; }
  return Number(field) === value;
}

export function describe(expr: string) {
  const [minute, hour, dom, month, dow] = expr.trim().split(/\s+/);
  if (!minute || !hour || !dom || !month || !dow) return "Five fields are required: minute, hour, day, month, weekday.";
  const time = minute === "*" && hour === "*" ? "every minute" : minute.startsWith("*/") ? `every ${minute.slice(2)} minutes` : hour === "*" ? `at minute ${minute} of every hour` : `at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  const dates = [dom !== "*" ? `day ${dom}` : "every day", month !== "*" ? `month ${month}` : "all months", dow !== "*" ? `weekday ${dow}` : "all weekdays"];
  return `${time}; ${dates.join(" · ")}`;
}

export function nextRuns(expr: string, count = 5) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return [];
  const [minute, hour, dom, month, dow] = parts;
  const cursor = new Date(); cursor.setSeconds(0, 0); cursor.setMinutes(cursor.getMinutes() + 1);
  const runs: string[] = [];
  for (let i = 0; i < 60 * 24 * 400 && runs.length < count; i += 1) {
    const weekday = cursor.getDay();
    if (fieldMatches(minute, cursor.getMinutes(), 0, 59) && fieldMatches(hour, cursor.getHours(), 0, 23) && fieldMatches(dom, cursor.getDate(), 1, 31) && fieldMatches(month, cursor.getMonth() + 1, 1, 12) && (dow === "*" || fieldMatches(dow.replaceAll("7", "0"), weekday, 0, 6))) runs.push(cursor.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return runs;
}

export const PRESETS: readonly (readonly [string, string])[] = [
  ["Every minute", "* * * * *"], ["Hourly", "0 * * * *"], ["Weekdays · 09:00", "0 9 * * 1-5"], ["Monday · 09:00", "0 9 * * 1"], ["First of month", "0 0 1 * *"],
];
export const FIELDS = ["minute", "hour", "day", "month", "weekday"];

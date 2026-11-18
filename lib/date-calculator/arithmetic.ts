export const CALENDAR_TIME_ZONE = "Asia/Bangkok";
export const toInputValue = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: CALENDAR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "01";
  return `${get("year")}-${get("month")}-${get("day")}`;
};
/** "Wed, Dec 2, 2026": weekday first, no leading zero. */
export const displayDate = (value: string) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));

export type DateUnit = "days" | "weeks" | "months";

const plural = (count: number, word: string) => `${count} ${count === 1 ? word : `${word}s`}`;
const DAY = 86400000;
const utcDate = (value: string) => new Date(`${value}T00:00:00Z`);

/** `months` whole calendar months after `date`, the day clamped to the month's last day (Jan 31 + 1 month = Feb 28/29). */
function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getUTCFullYear(); const month = date.getUTCMonth() + months;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), last)));
}

/**
 * Days between two dates, plus the same span in calendar words: "2 weeks 3 days" and "1 month 7 days" (or
 * "1 year 2 months 3 days"). A negative span (end before start) keeps the sign on the day count and a minus in front.
 */
export function dateDifference(start: string, end: string) {
  const days = Math.round((utcDate(end).getTime() - utcDate(start).getTime()) / DAY);
  const sign = days < 0 ? "−" : "";
  const [from, to] = days < 0 ? [utcDate(end), utcDate(start)] : [utcDate(start), utcDate(end)];
  const span = Math.abs(days);
  const weekCount = Math.floor(span / 7);
  const weeks = `${sign}${[weekCount ? plural(weekCount, "week") : "", span % 7 || !weekCount ? plural(span % 7, "day") : ""].filter(Boolean).join(" ")}`;
  let monthCount = 0;
  while (addMonthsClamped(from, monthCount + 1).getTime() <= to.getTime()) monthCount += 1;
  const rest = Math.round((to.getTime() - addMonthsClamped(from, monthCount).getTime()) / DAY);
  const years = Math.floor(monthCount / 12);
  const parts = [years ? plural(years, "year") : "", plural(monthCount % 12, "month"), plural(rest, "day")];
  const months = `${sign}${(years ? parts.filter((part, index) => index !== 1 || monthCount % 12) : parts).filter(Boolean).join(" ")}`;
  return { days, weeks, months };
}

export function shiftDate(base: string, amount: number, unit: DateUnit) {
  const date = new Date(`${base}T00:00:00Z`);
  if (unit === "days") date.setUTCDate(date.getUTCDate() + amount);
  else if (unit === "weeks") date.setUTCDate(date.getUTCDate() + amount * 7);
  else date.setUTCMonth(date.getUTCMonth() + amount);
  return toInputValue(date);
}

export const CALENDAR_TIME_ZONE = "Asia/Bangkok";
export const toInputValue = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: CALENDAR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "01";
  return `${get("year")}-${get("month")}-${get("day")}`;
};
export const displayDate = (value: string) => new Intl.DateTimeFormat("en-US", { timeZone: CALENDAR_TIME_ZONE, day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));

export type DateUnit = "days" | "weeks" | "months";

export function dateDifference(start: string, end: string) {
  const days = Math.round((new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86400000);
  return { days, weeks: (days / 7).toFixed(2), months: (days / 30.44).toFixed(2) };
}

export function shiftDate(base: string, amount: number, unit: DateUnit) {
  const date = new Date(`${base}T00:00:00Z`);
  if (unit === "days") date.setUTCDate(date.getUTCDate() + amount);
  else if (unit === "weeks") date.setUTCDate(date.getUTCDate() + amount * 7);
  else date.setUTCMonth(date.getUTCMonth() + amount);
  return toInputValue(date);
}

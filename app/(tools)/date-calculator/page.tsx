"use client";

import { useMemo, useState } from "react";
import { CALENDAR_TIME_ZONE, toInputValue, displayDate, dateDifference, shiftDate } from "@/lib/date-calculator/arithmetic";


export default function Home() {
  const today = useMemo(() => new Date(), []);
  const [start, setStart] = useState(toInputValue(today));
  const [end, setEnd] = useState(toInputValue(new Date(today.getTime() + 7 * 86400000)));
  const [base, setBase] = useState(toInputValue(today));
  const [amount, setAmount] = useState(14);
  const [unit, setUnit] = useState<"days" | "weeks" | "months">("days");
  const diff = useMemo(() => dateDifference(start, end), [start, end]);
  const shifted = useMemo(() => shiftDate(base, amount, unit), [base, amount, unit]);
  const direction = diff.days >= 0 ? "forward" : "backward";
  const todayParts = new Intl.DateTimeFormat("en-US", { timeZone: CALENDAR_TIME_ZONE, day: "2-digit", month: "short" }).formatToParts(today);
  const todayDay = todayParts.find((part) => part.type === "day")?.value ?? "01";
  const todayMonth = (todayParts.find((part) => part.type === "month")?.value ?? "Jan").toUpperCase();

  return (
    <main className="calendar-shell">
      <header className="calendar-header"><div className="calendar-glyph" aria-hidden="true"><span>01</span><span>07</span><span>14</span><span>21</span><span>28</span></div><div><p className="calendar-kicker">DATE CALCULATOR / CALENDAR SLIDE</p><h1>Put a measure<br /><i>on time.</i></h1><p className="calendar-deck">Compare two dates or push a date forward. The answer stays close to the inputs, like a ruler laid across the calendar.</p></div><div className="today-marker"><span>TODAY</span><strong>{todayDay}</strong><small>{todayMonth}</small></div></header>

      <section className="difference-section" aria-labelledby="difference-title"><div className="section-rail"><span className="rail-dot" /><p>01 / COMPARE</p><span>INTERVAL</span></div><div className="compare-main"><div className="section-heading"><div><p className="calendar-kicker">DIFFERENCE</p><h2 id="difference-title">How far apart?</h2></div><span className="direction-word">{direction}</span></div><div className="date-inputs"><label><span>START</span><input type="date" value={start} onChange={(event) => setStart(event.target.value)} /><b>{displayDate(start)}</b></label><div className="measure-line" aria-hidden="true"><i /><i /><strong>{diff.days >= 0 ? "→" : "←"}</strong></div><label><span>END</span><input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /><b>{displayDate(end)}</b></label></div><div className="answer-tape"><div><span>DAYS</span><strong>{diff.days}</strong></div><div><span>WEEKS</span><strong>{diff.weeks}</strong></div><div><span>MONTHS ≈</span><strong>{diff.months}</strong></div></div></div></section>

      <section className="shift-section" aria-labelledby="shift-title"><div className="section-rail"><span className="rail-dot coral" /><p>02 / SHIFT</p><span>ARITHMETIC</span></div><div className="shift-main"><div className="section-heading"><div><p className="calendar-kicker">ADD / SUBTRACT</p><h2 id="shift-title">Where will it land?</h2></div><div className="result-badge"><span>RESULT</span><strong>{displayDate(shifted)}</strong></div></div><div className="shift-controls"><label><span>BASE DATE</span><input type="date" value={base} onChange={(event) => setBase(event.target.value)} /></label><label><span>AMOUNT</span><input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label><label><span>UNIT</span><select value={unit} onChange={(event) => setUnit(event.target.value as typeof unit)}><option value="days">days</option><option value="weeks">weeks</option><option value="months">months</option></select></label></div><div className="shift-equation"><span>{displayDate(base)}</span><b>{amount >= 0 ? "+" : "−"} {Math.abs(amount)} {unit}</b><strong>→ {displayDate(shifted)}</strong></div><p className="honesty-note">Month results use the browser calendar for shifting. The comparison’s month figure is an average of 30.44 days.</p></div></section>
      <footer className="calendar-footer"><span>DATE CALCULATOR / 2026</span><span>Browser-only arithmetic · no account · no API</span></footer>
    </main>
  );
}

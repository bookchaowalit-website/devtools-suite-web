"use client";

import { useState } from "react";
import { Segmented, ToolIntro, useIsClient, Workbench } from "@/components/workbench";
import { dateDifference, displayDate, shiftDate, toInputValue, type DateUnit } from "@/lib/date-calculator/arithmetic";

const UNITS = [{ value: "days", label: "Days" }, { value: "weeks", label: "Weeks" }, { value: "months", label: "Months" }] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const addDays = (value: string, days: number) => toInputValue(new Date(new Date(`${value}T00:00:00Z`).getTime() + days * 86400000));

export default function DateCalculatorTool() {
  // Today depends on the viewer's clock, so the defaults are only filled in after hydration
  // (otherwise the build-time date would be baked into the HTML: React error #418).
  const isClient = useIsClient();
  const today = isClient ? toInputValue(new Date()) : "";
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [base, setBase] = useState<string | null>(null);
  const [amount, setAmount] = useState("14");
  const [unit, setUnit] = useState<DateUnit>("days");

  const startValue = start ?? today;
  const endValue = end ?? (today ? addDays(today, 7) : "");
  const baseValue = base ?? today;
  const amountNumber = Number(amount);
  const amountValid = amount.trim() !== "" && Number.isInteger(amountNumber) && Math.abs(amountNumber) <= 100000;

  const diff = DATE_RE.test(startValue) && DATE_RE.test(endValue) ? dateDifference(startValue, endValue) : null;
  const shifted = DATE_RE.test(baseValue) && amountValid ? shiftDate(baseValue, amountNumber, unit) : null;

  return (
    <Workbench>
      <ToolIntro title="Date Calculator" summary="Count the days between two dates, or add and subtract days, weeks or months." />

      <div className="wb-cards">
        <section className="wb-card" aria-labelledby="between-title">
          <h2 id="between-title">Days between</h2>
          {!isClient ? <p className="wb-note wb-note-top" role="status">Loading today’s date…</p> : null}
          {/* Start and End stay side by side on phones, so both cards fit higher up the screen. */}
          <div className="wb-inputs wb-inputs-pair">
            <label className="wb-input">Start<input type="date" value={startValue} onChange={(event) => setStart(event.target.value)} /></label>
            <label className="wb-input">End<input type="date" value={endValue} onChange={(event) => setEnd(event.target.value)} /></label>
          </div>
          <dl className="wb-figures wb-figures-3" aria-live="polite">
            <div><dt>Days</dt><dd>{diff ? diff.days : "—"}</dd></div>
            <div><dt>In weeks</dt><dd className="wb-figure-text">{diff ? diff.weeks : "—"}</dd></div>
            <div><dt>In months</dt><dd className="wb-figure-text">{diff ? diff.months : "—"}</dd></div>
          </dl>
          {diff && diff.days < 0 ? <p className="wb-note">The end date is before the start date, so the numbers are negative.</p> : null}
        </section>

        <section className="wb-card" aria-labelledby="shift-title">
          <h2 id="shift-title">Add or subtract</h2>
          <div className="wb-inputs wb-inputs-pair">
            <label className="wb-input">Date<input type="date" value={baseValue} onChange={(event) => setBase(event.target.value)} /></label>
            <label className="wb-input">Amount<input type="number" inputMode="numeric" step={1} value={amount} onChange={(event) => setAmount(event.target.value)} aria-invalid={amountValid ? undefined : true} aria-describedby="shift-amount-hint" /></label>
            <Segmented label="Unit" options={UNITS} value={unit} onChange={setUnit} />
          </div>
          <p id="shift-amount-hint" className="wb-note">Use a negative amount to go back in time.{amountValid ? "" : " Enter a whole number."}</p>
          <p className="wb-answer" aria-live="polite">
            {shifted && baseValue ? (
              <>{displayDate(baseValue)} {amountNumber >= 0 ? "+" : "−"} {Math.abs(amountNumber)} {unit}<strong>{displayDate(shifted)}</strong></>
            ) : (
              <>Result<strong>{isClient ? "—" : "Loading…"}</strong></>
            )}
          </p>
        </section>
      </div>

      <p className="wb-hint">Dates use the Asia/Bangkok calendar. “In months” counts whole calendar months, then the days left over: Jan 31 to Feb 28 is one month. Adding months uses the same rule: Jan 31 + 1 month is Feb 28 (Feb 29 in a leap year).</p>
    </Workbench>
  );
}

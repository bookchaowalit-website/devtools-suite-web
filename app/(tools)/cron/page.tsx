"use client";

import { useMemo, useState } from "react";
import { AlertIcon, CheckIcon, CopyIcon, ToolIntro, useCopy, useIsClient, Workbench } from "@/components/workbench";
import { describe, FIELDS, nextRuns, PRESETS, validateCron } from "@/lib/cron/cron";

export default function CronTool() {
  const [expr, setExpr] = useState("0 9 * * 1-5");
  const [announcement, setAnnouncement] = useState("");
  const { copied, copy } = useCopy(expr, (ok) => setAnnouncement(ok ? "Expression copied to the clipboard." : "Copy was blocked. Select the expression and copy it by hand."));
  const parts = expr.trim().split(/\s+/).filter(Boolean);
  const check = validateCron(expr);
  const valid = check.ok;
  const badField = check.ok ? null : check.field;
  // Next runs depend on the viewer's clock and time zone: only compute them in the browser
  // so the server HTML never disagrees (React hydration error #418).
  const isClient = useIsClient();
  const runs = useMemo(() => (isClient && valid ? nextRuns(expr) : []), [expr, isClient, valid]);

  return (
    <Workbench>
      <ToolIntro title="Cron Helper" summary="Write a standard five-field cron expression, read it in plain English and see when it runs next." />

      <section className="wb-card" aria-labelledby="cron-label">
        <label id="cron-label" htmlFor="cron-expr" className="wb-expression-label">Cron expression <span className="wb-muted">minute hour day month weekday</span></label>
        <div className="wb-expression">
          <input id="cron-expr" value={expr} onChange={(event) => setExpr(event.target.value)} spellCheck={false} autoComplete="off" aria-invalid={valid ? undefined : true} aria-describedby={valid ? "cron-fields" : "cron-error cron-fields"} />
          <button type="button" className="wb-button" onClick={() => copy(expr)} disabled={!valid}>
            {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
          </button>
        </div>
        <ol id="cron-fields" className="wb-cron-fields" aria-label="Fields">
          {FIELDS.map((field, index) => (
            <li key={field} data-invalid={badField === index ? "true" : undefined}><code>{parts[index] ?? "—"}</code><span>{field}</span></li>
          ))}
        </ol>
        {check.ok ? null : <p id="cron-error" className="wb-error wb-error-inline" role="alert"><AlertIcon />{check.message}</p>}

        <div className="wb-chips" role="group" aria-label="Presets">
          {PRESETS.map(([label, value]) => (
            <button key={value} type="button" aria-pressed={expr === value} onClick={() => setExpr(value)}>{label}</button>
          ))}
        </div>
      </section>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <div className="wb-panes wb-panes-gap">
        <section className="wb-card" aria-labelledby="cron-meaning">
          <h2 id="cron-meaning">Meaning</h2>
          <p className="wb-lead">{valid ? describe(expr) : "Fix the expression above to read it in plain English."}</p>
        </section>
        <section className="wb-card" aria-labelledby="cron-next">
          <h2 id="cron-next">Next 5 runs <span className="wb-muted">in your local time</span></h2>
          {!isClient ? (
            <p className="wb-note">Calculating in your local time…</p>
          ) : runs.length ? (
            <ol className="wb-list">{runs.map((run) => <li key={run}><time>{run}</time></li>)}</ol>
          ) : (
            <p className="wb-note">{valid ? "No run found in the next 400 days. Check the fields above." : "Fix the expression to see run times."}</p>
          )}
        </section>
      </div>

      <p className="wb-hint">Supports *, numbers, ranges (1-5), lists (1,15) and steps (*/10). Minute 0–59, hour 0–23, day 1–31, month 1–12, weekday 0–7 (0 and 7 are Sunday). Run times are an estimate from your browser.</p>
    </Workbench>
  );
}

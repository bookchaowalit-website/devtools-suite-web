"use client";

import { useMemo, useState } from "react";
import { AlertIcon, ToolIntro, Workbench } from "@/components/workbench";
import { addRun, MAX_RUNS, normalizeTarget, summarize, TIMEOUT_MS, type Run } from "@/lib/latency-test/latency";

const PRESETS = ["/", "https://example.com", "https://bookchaowalit.com"];

export default function LatencyTool() {
  const [url, setUrl] = useState("/");
  const [runs, setRuns] = useState<Run[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const summary = useMemo(() => summarize(runs), [runs]);
  const latest = runs[0];

  async function ping() {
    const target = normalizeTarget(url, window.location.origin);
    if ("error" in target) { setError(target.error); return; }
    setError("");
    setBusy(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    const started = performance.now();
    let ok = false;
    try {
      // Same-origin targets get a normal request; cross-origin targets use no-cors so an
      // opaque response still counts as a completed round trip without reading its body.
      const sameOrigin = new URL(target.url).origin === window.location.origin;
      await fetch(target.url, { cache: "no-store", mode: sameOrigin ? "same-origin" : "no-cors", signal: controller.signal });
      ok = true;
    } catch {
      ok = false;
    } finally {
      window.clearTimeout(timer);
      const ms = Math.round(performance.now() - started);
      setRuns((previous) => addRun(previous, { ms, ok, at: Date.now(), target: target.host }));
      setBusy(false);
    }
  }

  return (
    <Workbench>
      <ToolIntro title="Latency Test" summary="Time one request from this browser to a URL. Run it a few times to see the average." privacy="Runs in your browser. The only request goes to the URL you enter." />

      <section className="wb-card" aria-labelledby="target-label">
        <form className="wb-expression" onSubmit={(event) => { event.preventDefault(); void ping(); }}>
          <label id="target-label" htmlFor="latency-url" className="wb-sr">URL to test</label>
          <input id="latency-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" inputMode="url" autoComplete="url" spellCheck={false} aria-invalid={error ? true : undefined} aria-describedby={error ? "latency-error" : undefined} />
          <button type="submit" className="wb-button" disabled={busy}>{busy ? "Testing…" : "Test"}</button>
        </form>
        {error ? <p id="latency-error" className="wb-error wb-error-inline" role="alert"><AlertIcon />{error}</p> : null}
        <div className="wb-chips" role="group" aria-label="Example URLs">
          {PRESETS.map((preset) => (
            <button key={preset} type="button" aria-pressed={url === preset} onClick={() => setUrl(preset)}>{preset === "/" ? "This site" : preset.replace("https://", "")}</button>
          ))}
        </div>
      </section>

      <dl className="wb-figures" aria-live="polite">
        <div><dt>Last</dt><dd>{latest ? (latest.ok ? `${latest.ms} ms` : "Failed") : "—"}</dd></div>
        <div><dt>Average</dt><dd>{summary.ok ? `${summary.average} ms` : "—"}</dd></div>
        <div><dt>Median</dt><dd>{summary.ok > 1 ? `${summary.median} ms` : "—"}</dd></div>
        <div><dt>Min – max</dt><dd>{summary.ok > 1 ? `${summary.min}–${summary.max}` : "—"}</dd></div>
      </dl>

      <section className="wb-card wb-panes-gap" aria-labelledby="log-title">
        <h2 id="log-title">History <span className="wb-muted">newest first, last {MAX_RUNS}</span></h2>
        {runs.length ? (
          <ol className="wb-list wb-log">
            {runs.map((run, index) => (
              <li key={`${run.at}-${index}`}>
                <strong>{run.ok ? `${run.ms} ms` : "Failed"}</strong>
                <span>{run.target}</span>
                <span className="wb-muted">{run.ok ? "" : `after ${run.ms} ms · `}{new Date(run.at).toLocaleTimeString()}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="wb-note">No tests yet. Press Test to time the first request.</p>
        )}
      </section>

      <p className="wb-hint">Timing includes DNS, connection and server time as seen by this browser. Cross-site requests can only report that a response arrived, not its status. Failed requests are left out of the average. Times out after {TIMEOUT_MS / 1000} s.</p>
    </Workbench>
  );
}

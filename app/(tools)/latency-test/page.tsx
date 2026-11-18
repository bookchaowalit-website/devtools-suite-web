"use client";

import { useMemo, useRef, useState } from "react";
import { AlertIcon, ToolIntro, Workbench } from "@/components/workbench";
import { addRun, MAX_RUNS, normalizeTarget, runAnnouncement, summarize, TIMEOUT_MS, type Run } from "@/lib/latency-test/latency";

const BATCH = 5;

const PRESETS = ["/", "https://example.com", "https://bookchaowalit.com"];

export default function LatencyTool() {
  const [url, setUrl] = useState("/");
  const [runs, setRuns] = useState<Run[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const runsRef = useRef<Run[]>([]);
  const summary = useMemo(() => summarize(runs), [runs]);
  const latest = runs[0];

  /** Times `times` requests one after another (never in parallel, so they do not slow each other down). */
  async function test(times = 1) {
    const target = normalizeTarget(url, window.location.origin);
    if ("error" in target) { setError(target.error); return; }
    setError("");
    setBusy(true);
    for (let round = 1; round <= times; round += 1) {
      if (times > 1) setProgress(`Run ${round} of ${times}…`);
      const run = await ping(target);
      runsRef.current = addRun(runsRef.current, run);
      setRuns(runsRef.current);
      if (round === times) setAnnouncement(times > 1 ? `${times} runs done. ${runAnnouncement(run, summarize(runsRef.current))}` : runAnnouncement(run, summarize(runsRef.current)));
    }
    setProgress("");
    setBusy(false);
  }

  async function ping(target: { url: string; host: string }): Promise<Run> {
    const sameOrigin = new URL(target.url).origin === window.location.origin;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    const started = performance.now();
    let ok = false;
    try {
      // Same-origin targets get a normal request; cross-origin targets use no-cors so an
      // opaque response still counts as a completed round trip without reading its body.
      await fetch(target.url, { cache: "no-store", mode: sameOrigin ? "same-origin" : "no-cors", signal: controller.signal });
      ok = true;
    } catch {
      ok = false;
    } finally {
      window.clearTimeout(timer);
    }
    return { ms: Math.round(performance.now() - started), ok, at: Date.now(), target: target.host, opaque: !sameOrigin };
  }
  const clearHistory = () => { runsRef.current = []; setRuns([]); setAnnouncement("History cleared."); };

  return (
    <Workbench>
      <ToolIntro title="Latency Test" summary="Time one request from this browser to a URL. Run it a few times to see the average." privacy="Runs in your browser. The only request goes to the URL you enter." />

      <section className="wb-card" aria-labelledby="target-label">
        <label id="target-label" htmlFor="latency-url" className="wb-expression-label">URL to test <span className="wb-muted">/ means this site</span></label>
        <form className="wb-expression" onSubmit={(event) => { event.preventDefault(); void test(); }}>
          <input id="latency-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" inputMode="url" autoComplete="url" spellCheck={false} aria-invalid={error ? true : undefined} aria-describedby={error ? "latency-error" : undefined} />
          <button type="submit" className="wb-button" disabled={busy}>{busy ? "Testing…" : "Test"}</button>
          <button type="button" className="wb-button-plain" disabled={busy} onClick={() => void test(BATCH)}>Run {BATCH} times</button>
        </form>
        {progress ? <p className="wb-note">{progress}</p> : null}
        {error ? <p id="latency-error" className="wb-error wb-error-inline" role="alert"><AlertIcon />{error}</p> : null}
        <div className="wb-chips" role="group" aria-label="Example URLs">
          {PRESETS.map((preset) => (
            <button key={preset} type="button" aria-pressed={url === preset} onClick={() => setUrl(preset)}>{preset === "/" ? "This site" : preset.replace("https://", "")}</button>
          ))}
        </div>
      </section>

      {/* Figures are not a live region: one short sentence per run is announced instead (below). */}
      <dl className="wb-figures">
        <div><dt>Last{latest?.ok && latest.opaque ? <> <span className="wb-tag" title="Cross-site: the browser hides the status, so a 404 or 500 also counts as a reply">response not readable</span></> : null}</dt><dd>{latest ? (latest.ok ? `${latest.ms} ms` : <span className="wb-failed"><AlertIcon />Failed</span>) : "—"}</dd></div>
        <div><dt>Average</dt><dd>{summary.ok ? `${summary.average} ms` : "—"}</dd></div>
        <div><dt>Median</dt><dd>{summary.ok > 1 ? `${summary.median} ms` : "—"}</dd></div>
        <div><dt>Min – max</dt><dd>{summary.ok > 1 ? `${summary.min}–${summary.max}` : "—"}</dd></div>
      </dl>

      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <section className="wb-card wb-panes-gap" aria-labelledby="log-title">
        <div className="wb-card-head">
          <h2 id="log-title">History <span className="wb-muted">newest first, last {MAX_RUNS}</span></h2>
          <button type="button" className="wb-button-plain" onClick={clearHistory} disabled={!runs.length || busy}>Clear history</button>
        </div>
        {runs.length ? (
          <ol className="wb-list wb-log">
            {runs.map((run, index) => (
              <li key={`${run.at}-${index}`}>
                <strong>{run.ok ? `${run.ms} ms` : <span className="wb-failed"><AlertIcon />Failed</span>}</strong>
                <span>{run.target}{run.ok && run.opaque ? <> <span className="wb-tag">response not readable</span></> : null}</span>
                <span className="wb-muted">{run.ok ? "" : `after ${run.ms} ms · `}{new Date(run.at).toLocaleTimeString()}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="wb-note">No tests yet. Press Test to time the first request.</p>
        )}
      </section>

      <p className="wb-hint">Timing includes DNS, connection and server time as seen by this browser. Cross-site requests can only report that a response arrived, not its status, so they are marked “response not readable”. History is kept only until you reload. Failed requests are left out of the average. Times out after {TIMEOUT_MS / 1000} s.</p>
    </Workbench>
  );
}

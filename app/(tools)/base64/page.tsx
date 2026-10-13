"use client";

import { useState } from "react";
import { Base64Error, decodeBase64, encodeBase64, plural, textStats } from "@/lib/base64/base64";

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export default function Home() {
  const [input, setInput] = useState("Hello, portfolio!");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [status, setStatus] = useState("BENCH READY / LOCAL ONLY");
  const inputStats = textStats(input);
  const outputStats = textStats(output);

  const run = () => {
    setError("");
    try {
      if (mode === "encode") {
        setOutput(encodeBase64(input, { urlSafe }));
        setStatus(urlSafe ? "PRINT READY / URL-SAFE BASE64" : "PRINT READY / BASE64 OUTPUT");
      } else {
        setOutput(decodeBase64(input));
        setStatus("PRINT READY / UTF-8 TEXT");
      }
    } catch (caught) {
      setOutput("");
      setError(caught instanceof Base64Error ? `The tray contains invalid Base64: ${caught.message}` : "The text could not be exposed.");
      setStatus("HOLD / CHECK INPUT");
    }
  };

  const swap = () => {
    setInput(output); setOutput(input);
    setMode((current) => (current === "encode" ? "decode" : "encode"));
    setError(""); setStatus("TRAYS SWAPPED / READY");
  };
  const clear = () => { setInput(""); setOutput(""); setError(""); setStatus("BENCH CLEARED / LOCAL ONLY"); };
  const copy = async () => {
    if (!output) return;
    setStatus((await copyText(output)) ? "COPIED / OUTPUT IN CLIPBOARD" : "COPY BLOCKED / SELECT OUTPUT");
  };

  return (
    <main className="exposure-page">
      <div className="exposure-shell">
        <header className="exposure-header">
          <div className="exposure-mark">EXPOSURE / 64</div>
          <div className="exposure-status" aria-live="polite">{status}</div>
          <p className="exposure-note">A UTF-8-safe Base64 bench. Nothing leaves this browser.</p>
        </header>
        <section className="exposure-intro" aria-labelledby="page-title">
          <div>
            <h1 id="page-title">Develop the payload.</h1>
            <p>Move between readable text and Base64 without losing the trail. The result stays in the tray until you take it.</p>
          </div>
          <div className="exposure-receipt" role="group" aria-label="Current operation">
            <span>PROCESS</span><strong>{mode === "encode" ? "EXPOSE → ENCODE" : "DEVELOP → DECODE"}</strong><small>TEXT ONLY / NO UPLOAD</small>
          </div>
        </section>
        <div className="exposure-switch" role="group" aria-label="Conversion direction">
          <button type="button" className={mode === "encode" ? "is-active" : ""} aria-pressed={mode === "encode"} onClick={() => setMode("encode")}>01 / Expose to Base64</button>
          <button type="button" className={mode === "decode" ? "is-active" : ""} aria-pressed={mode === "decode"} onClick={() => setMode("decode")}>02 / Develop to text</button>
        </div>
        <section className="exposure-bench" aria-label="Base64 workbench">
          <label className="exposure-tray"><span className="tray-label">{mode === "encode" ? "SOURCE / PLAIN TEXT" : "SOURCE / BASE64"}</span><textarea value={input} onChange={(event) => setInput(event.target.value)} aria-label="Source input" aria-invalid={error ? true : undefined} aria-describedby={error ? "exposure-error" : undefined} spellCheck={false} /><span className="tray-footer">{plural(inputStats.characters, "character")} · {plural(inputStats.bytes, "byte")} · edit before processing</span></label>
          <div className="exposure-arrow" aria-hidden="true">→</div>
          <label className="exposure-tray result-tray"><span className="tray-label">RESULT / {mode === "encode" ? "BASE64" : "PLAIN TEXT"}</span><textarea value={output} readOnly aria-label="Conversion result" placeholder="The developed result appears here." spellCheck={false} /><span className="tray-footer">{plural(outputStats.characters, "character")} · {plural(outputStats.bytes, "byte")} · safe to copy</span></label>
        </section>
        {error ? <p id="exposure-error" className="exposure-error" role="alert">{error}</p> : null}
        <div className="exposure-actions">
          <button type="button" className="exposure-primary" onClick={run}>{mode === "encode" ? "Expose payload" : "Develop payload"}</button>
          <button type="button" className="exposure-secondary" onClick={copy} disabled={!output}>Take result</button>
          <button type="button" className="exposure-quiet" onClick={swap}>Swap trays</button>
          <button type="button" className="exposure-quiet" onClick={clear}>Clear bench</button>
          <label className="exposure-option">
            <input type="checkbox" checked={urlSafe} onChange={(event) => setUrlSafe(event.target.checked)} disabled={mode === "decode"} />
            <span>URL-safe output (- and _, no padding)</span>
          </label>
        </div>
        <p className="exposure-hint">Decoding accepts standard or URL-safe Base64 and ignores line breaks.</p>
        <footer className="exposure-footer">BROWSER PROCESSING / NO SERVER REQUIRED / BOOKCHAOWALIT DEVELOPER TOOLS</footer>
      </div>
    </main>
  );
}

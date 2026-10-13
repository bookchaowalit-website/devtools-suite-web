"use client";

import { useEffect, useState } from "react";

const algorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
type Algorithm = (typeof algorithms)[number];
async function makeDigest(algorithm: Algorithm, value: string) { const bytes = await crypto.subtle.digest(algorithm, new TextEncoder().encode(value)); return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }

export default function Home() {
  const [input, setInput] = useState("hello world");
  const [algorithm, setAlgorithm] = useState<Algorithm>("SHA-256");
  const [digest, setDigest] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  async function generate() { setBusy(true); setCopied(false); setDigest(await makeDigest(algorithm, input)); setBusy(false); }
  // Deferred so the digest is recomputed outside the effect body.
  useEffect(() => { const timer = window.setTimeout(() => void generate(), 0); return () => window.clearTimeout(timer); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm]);
  async function copy() { if (!digest) return; try { await navigator.clipboard.writeText(digest); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setCopied(false); } }

  return <main className="lab-shell">
    <header className="lab-header"><div className="lab-id"><span>SPECIMEN</span><strong>H·26</strong><span>WEB CRYPTO</span></div><div><p className="eyebrow">BOOKCHAOWALIT / DEVELOPER LAB</p><h1>Hash<br /><em>generator</em></h1><p className="lede">A quiet instrument for turning text into a reproducible hexadecimal fingerprint.</p></div><div className="lab-meta"><span>MODE</span><strong>LOCAL</strong><span>input never uploaded</span></div></header>
    <div className="calibration"><span /><span /><span /><span /><span /><span /><span /><span /></div>
    <section className="instrument" aria-label="Hash generator instrument"><div className="instrument-top"><div><span className="section-label">01 / SELECT DIGEST</span><h2>Choose a family.</h2></div><span className="readout">{algorithm} · READY</span></div><div className="algorithm-row">{algorithms.map((item) => <button key={item} type="button" className={item === algorithm ? "selected" : ""} onClick={() => setAlgorithm(item)} aria-pressed={item === algorithm}><span className="radio" />{item}<small>{item === "SHA-1" ? "160 bit" : item === "SHA-256" ? "256 bit" : item === "SHA-384" ? "384 bit" : "512 bit"}</small></button>)}</div>
      <div className="workbench"><div className="input-column"><label htmlFor="hash-input"><span>02 / SOURCE TEXT</span><small>{new TextEncoder().encode(input).length} bytes</small></label><textarea id="hash-input" value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} /><div className="input-foot"><span>UTF—8</span><button type="button" onClick={() => setInput("")}>Clear source</button></div></div><div className="connector" aria-hidden="true"><span>digest</span><i /></div><div className="output-column"><div className="output-label"><span>03 / HEXADECIMAL OUTPUT</span><small>{digest.length} chars</small></div><output className="digest-output" aria-live="polite">{busy ? <span className="working">CALCULATING<span>···</span></span> : digest || <span className="placeholder">Generate a fingerprint</span>}</output><div className="output-foot"><span>READ ONLY</span><button type="button" onClick={() => void copy()} disabled={!digest}>{copied ? "Copied to clipboard" : "Copy digest ↗"}</button></div></div></div>
      <div className="action-row"><button className="generate" type="button" onClick={() => void generate()} disabled={busy}>{busy ? "Calculating…" : "Generate digest"}<span>→</span></button><p>Same input + same algorithm = same fingerprint.<br />Computed entirely by your browser.</p></div>
    </section>
    <footer className="lab-footer"><span>HASHGEN / CALIBRATION 02</span><span>SHA family · hexadecimal notation</span></footer>
  </main>;
}

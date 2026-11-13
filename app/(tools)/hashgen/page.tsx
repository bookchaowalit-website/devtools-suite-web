"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { algorithms, makeDigest, type Algorithm } from "@/lib/hashgen/digest";

const BITS: Record<Algorithm, number> = { "SHA-1": 160, "SHA-256": 256, "SHA-384": 384, "SHA-512": 512 };

export default function HashTool() {
  const [input, setInput] = useState("hello world");
  const [algorithm, setAlgorithm] = useState<Algorithm>("SHA-256");
  // The digest is stored with the input and algorithm it belongs to, so a stale result is never shown.
  const [result, setResult] = useState<{ key: string; digest: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const key = `${algorithm}\u0000${input}`;
  useEffect(() => {
    let cancelled = false;
    makeDigest(algorithm, input).then((digest) => { if (!cancelled) setResult({ key: `${algorithm}\u0000${input}`, digest }); });
    return () => { cancelled = true; };
  }, [algorithm, input]);
  const digest = result?.key === key ? result.digest : "";
  const { copied, copy } = useCopy(digest, (ok) => setAnnouncement(ok ? "Hash copied to the clipboard." : "Copy was blocked. Select the hash and copy it by hand."));
  const bytes = new TextEncoder().encode(input).length;

  return (
    <Workbench>
      <ToolIntro title="Hash Generator" summary="Get a SHA fingerprint of any text. The same text and algorithm always give the same hash." />

      <fieldset className="wb-options">
        <legend>Algorithm</legend>
        {algorithms.map((item) => (
          <label key={item} className="wb-option">
            <input type="radio" name="algorithm" value={item} checked={algorithm === item} onChange={() => setAlgorithm(item)} />
            <strong>{item}</strong>
            <span>{BITS[item]}-bit{item === "SHA-1" ? ", legacy only" : ""}</span>
          </label>
        ))}
      </fieldset>

      <div className="wb-panes">
        <section className="wb-pane">
          <div className="wb-pane-head">
            <label htmlFor="hash-input">Text</label>
            <button type="button" className="wb-button-plain" onClick={() => setInput("")} disabled={!input}>Clear</button>
          </div>
          <textarea id="hash-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type or paste text" aria-describedby="hash-input-meta" spellCheck={false} autoComplete="off" />
          <p id="hash-input-meta" className="wb-pane-meta">{bytes} {bytes === 1 ? "byte" : "bytes"} (UTF-8)</p>
        </section>

        <section className="wb-pane" aria-labelledby="hash-output-label">
          <div className="wb-pane-head">
            <h2 id="hash-output-label">{algorithm} hash</h2>
            <button type="button" className="wb-button" onClick={() => copy(digest)} disabled={!digest}>
              {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
            </button>
          </div>
          <output className="wb-digest" htmlFor="hash-input" data-empty={digest ? undefined : "true"}>{digest || "Calculating…"}</output>
          <p className="wb-pane-meta">{digest.length || BITS[algorithm] / 4} hex characters · lowercase</p>
        </section>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <p className="wb-hint">Computed by your browser with the Web Crypto API. SHA-1 is broken for security uses; prefer SHA-256 or longer.</p>
    </Workbench>
  );
}

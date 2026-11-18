"use client";

import { useEffect, useState, type DragEvent } from "react";
import { AlertIcon, CheckIcon, CopyBlocked, CopyIcon, Segmented, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { algorithms, compareDigest, digestBytes, formatDigest, type Algorithm, type DigestFormat } from "@/lib/hashgen/digest";

const BITS: Record<Algorithm, number> = { "SHA-1": 160, "SHA-256": 256, "SHA-384": 384, "SHA-512": 512 };
type Source = "text" | "file";
const SOURCES = [{ value: "text", label: "Text" }, { value: "file", label: "File" }] as const;
const FORMATS = [{ value: "hex", label: "hex" }, { value: "HEX", label: "HEX" }, { value: "base64", label: "Base64" }] as const;
const FORMAT_NOTE: Record<DigestFormat, (bits: number) => string> = {
  hex: (bits) => `${bits / 4} hex characters · lowercase`,
  HEX: (bits) => `${bits / 4} hex characters · uppercase`,
  base64: (bits) => `${Math.ceil(bits / 8 / 3) * 4} Base64 characters`,
};
/** Web Crypto hashes a file in one piece, so very large files are refused instead of exhausting memory. */
const MAX_FILE_BYTES = 512 * 1024 * 1024;
type PickedFile = { name: string; size: number; key: string; data: ArrayBuffer };

const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} ${bytes === 1 ? "byte" : "bytes"}` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;

export default function HashTool() {
  const [source, setSource] = useState<Source>("text");
  const [input, setInput] = useState("hello world");
  const [file, setFile] = useState<PickedFile | null>(null);
  const [fileError, setFileError] = useState("");
  const [over, setOver] = useState(false);
  const [algorithm, setAlgorithm] = useState<Algorithm>("SHA-256");
  const [format, setFormat] = useState<DigestFormat>("hex");
  const [expected, setExpected] = useState("");
  // The digest is stored with the input and algorithm it belongs to, so a stale result is never shown.
  const [result, setResult] = useState<{ key: string; bytes: Uint8Array } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const subject = source === "text" ? (input === "" ? null : `text\u0000${input}`) : file ? `file\u0000${file.key}` : null;
  const key = subject ? `${algorithm}\u0000${subject}` : "";
  useEffect(() => {
    if (!subject) return;
    let cancelled = false;
    const value = source === "text" ? input : file?.data;
    if (value === undefined) return;
    digestBytes(algorithm, value).then((bytes) => { if (!cancelled) setResult({ key: `${algorithm}\u0000${subject}`, bytes }); });
    return () => { cancelled = true; };
  }, [algorithm, subject, source, input, file]);
  const bytes = key && result?.key === key ? result.bytes : null;
  const digest = bytes ? formatDigest(bytes, format) : "";
  const verdict = bytes ? compareDigest(expected, bytes) : "empty";
  const { copied, blocked, copy } = useCopy(digest, (ok) => setAnnouncement(ok ? "Hash copied to the clipboard." : "Copy was blocked. Select the hash and copy it by hand."));
  const textBytes = new TextEncoder().encode(input).length;

  const pick = async (picked: File | undefined) => {
    if (!picked) return;
    if (picked.size > MAX_FILE_BYTES) { setFile(null); setFileError(`${picked.name} is ${formatSize(picked.size)}; files up to 512 MB can be hashed in the browser.`); return; }
    setFileError("");
    const data = await picked.arrayBuffer();
    setFile({ name: picked.name, size: picked.size, key: `${picked.name}\u0000${picked.size}\u0000${picked.lastModified}`, data });
    setAnnouncement(`Hashing ${picked.name}.`);
  };
  const drop = (event: DragEvent<HTMLElement>) => { event.preventDefault(); setOver(false); void pick(event.dataTransfer.files[0]); };
  const emptyText = source === "text" ? "Type or paste text to get its hash." : "Choose or drop a file to get its hash.";

  return (
    <Workbench>
      <ToolIntro title="Hash Generator" summary="Get a SHA fingerprint of text or a file, and check a download against the checksum its site publishes." privacy="Runs in your browser. Text and files are never uploaded." />

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
      {algorithm === "SHA-1" ? (
        <p className="wb-callout" role="note"><AlertIcon /><span><strong>SHA-1 is broken for security.</strong> Use it only to match an old checksum; for anything new, choose SHA-256 or longer.</span></p>
      ) : null}

      <div className="wb-controls">
        <Segmented label="Hash a" options={SOURCES} value={source} onChange={setSource} />
        <Segmented label="Output format" options={FORMATS} value={format} onChange={setFormat} />
      </div>

      <div className="wb-panes">
        {source === "text" ? (
          <section className="wb-pane">
            <div className="wb-pane-head">
              <label htmlFor="hash-input">Text</label>
              <button type="button" className="wb-button-plain" onClick={() => setInput("")} disabled={!input}>Clear</button>
            </div>
            <textarea id="hash-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type or paste text" aria-describedby="hash-input-meta" spellCheck={false} autoComplete="off" />
            <p id="hash-input-meta" className="wb-pane-meta">{textBytes} {textBytes === 1 ? "byte" : "bytes"} (UTF-8)</p>
          </section>
        ) : (
          <section className="wb-pane" aria-labelledby="hash-file-label">
            <div className="wb-pane-head">
              <h2 id="hash-file-label">File</h2>
              <button type="button" className="wb-button-plain" onClick={() => { setFile(null); setFileError(""); }} disabled={!file}>Clear</button>
            </div>
            <label className="wb-drop" data-over={over ? "true" : undefined} onDragOver={(event) => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}>
              {file ? <><strong>{file.name}</strong><span>{formatSize(file.size)} · choose another or drop it here</span></> : <><strong>Choose a file</strong><span>or drop it here. It stays on this device.</span></>}
              <input className="wb-sr" type="file" onChange={(event) => void pick(event.target.files?.[0])} />
            </label>
            {fileError ? <p className="wb-error" role="alert"><AlertIcon />{fileError}</p> : <p className="wb-pane-meta">Up to 512 MB.</p>}
          </section>
        )}

        <section className="wb-pane" aria-labelledby="hash-output-label">
          <div className="wb-pane-head">
            <h2 id="hash-output-label">{algorithm} hash</h2>
            <button type="button" className="wb-button" onClick={() => copy(digest)} disabled={!digest}>
              {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
            </button>
          </div>
          <output className="wb-digest" htmlFor={source === "text" ? "hash-input" : undefined} data-empty={digest ? undefined : "true"}>{digest || (subject ? "Calculating…" : emptyText)}</output>
          <CopyBlocked show={blocked} what="the hash" />
          <p className="wb-pane-meta">{FORMAT_NOTE[format](BITS[algorithm])}</p>
        </section>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <section className="wb-card wb-panes-gap" aria-labelledby="hash-check-title">
        <h2 id="hash-check-title">Check against an expected hash</h2>
        <label className="wb-input">Expected hash <span className="wb-muted">paste the checksum from the download page (hex or Base64)</span>
          <input value={expected} onChange={(event) => setExpected(event.target.value)} spellCheck={false} autoComplete="off" placeholder="e.g. b94d27b9934d…" aria-describedby="hash-verdict" />
        </label>
        <p id="hash-verdict" className="wb-note" aria-live="polite">
          {verdict === "match" ? <span className="wb-verdict is-match"><CheckIcon />Match: the {algorithm} hash is the same.</span>
            : verdict === "mismatch" ? <span className="wb-verdict is-mismatch"><AlertIcon />No match. Check the algorithm, or the file may differ.</span>
              : bytes ? "Paste a hash to compare." : "Add text or a file first."}
        </p>
      </section>

      <p className="wb-hint">Computed by your browser with the Web Crypto API. SHA-1 is broken for security uses; prefer SHA-256 or longer.</p>
    </Workbench>
  );
}

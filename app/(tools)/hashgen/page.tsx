"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { AlertIcon, CheckIcon, CopyBlocked, CopyIcon, Segmented, ToolIntro, UndoToast, useCopy, useUndo, Workbench } from "@/components/workbench";
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
/** One selection of a file. `id` is new for every selection, so two files with the same name, size and date never share a result. */
type PickedFile = { id: number; name: string; size: number; data: ArrayBuffer | null };

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
  const [result, setResult] = useState<{ key: string; bytes: Uint8Array | null; error?: string } | null>(null);
  const selection = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const undo = useUndo();
  const [announcement, setAnnouncement] = useState("");

  // Empty text is a valid input (zero bytes has a hash); only "no file chosen yet" has nothing to hash.
  const subject = source === "text" ? `text\u0000${input}` : file?.data ? `file\u0000${file.id}` : null;
  const key = subject ? `${algorithm}\u0000${subject}` : "";
  useEffect(() => {
    if (!subject) return;
    let cancelled = false;
    const value = source === "text" ? input : file?.data;
    if (value === undefined || value === null) return;
    const resultKey = `${algorithm}\u0000${subject}`;
    digestBytes(algorithm, value)
      .then((bytes) => { if (!cancelled) setResult({ key: resultKey, bytes }); })
      .catch(() => { if (!cancelled) setResult({ key: resultKey, bytes: null, error: "The browser could not hash this input." }); });
    return () => { cancelled = true; };
  }, [algorithm, subject, source, input, file]);
  // Only a result for exactly this input (and this file selection) is ever shown, compared or copied.
  const bytes = key && result?.key === key ? result.bytes : null;
  const hashError = key && result?.key === key ? result.error ?? "" : "";
  const digest = bytes ? formatDigest(bytes, format) : "";
  const verdict = bytes ? compareDigest(expected, bytes) : "empty";
  const { copied, blocked, copy } = useCopy(digest, (ok) => setAnnouncement(ok ? "Hash copied to the clipboard." : "Copy was blocked. Select the hash and copy it by hand."));
  const textBytes = new TextEncoder().encode(input).length;

  const pick = async (picked: File | undefined) => {
    // Reset the input so choosing the same file again (after Clear, say) still fires a change.
    if (fileInput.current) fileInput.current.value = "";
    if (!picked) return;
    undo.dismiss();
    const id = ++selection.current;
    if (picked.size > MAX_FILE_BYTES) { setFile(null); setFileError(`${picked.name} is ${formatSize(picked.size)}; files up to 512 MB can be hashed in the browser.`); return; }
    setFileError("");
    // The new selection replaces the old one at once (no stale hash while it is read); a slower, older read is ignored.
    setFile({ id, name: picked.name, size: picked.size, data: null });
    setAnnouncement(`Hashing ${picked.name}.`);
    try {
      const data = await picked.arrayBuffer();
      if (selection.current === id) setFile({ id, name: picked.name, size: picked.size, data });
    } catch {
      if (selection.current === id) { setFile(null); setFileError(`${picked.name} could not be read. It may have been moved or changed; choose it again.`); }
    }
  };
  // Clear offers Undo, which brings the file back only if no other file was chosen since.
  const clearFile = () => {
    const cleared = file;
    const id = ++selection.current;
    setFile(null); setFileError(""); if (fileInput.current) fileInput.current.value = "";
    if (cleared?.data) undo.offer("File cleared.", () => { if (selection.current === id) { selection.current += 1; setFile({ ...cleared, id: selection.current }); } });
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
              <button type="button" className="wb-button-plain" onClick={clearFile} disabled={!file && !fileError}>Clear</button>
            </div>
            <label className="wb-drop" data-over={over ? "true" : undefined} onDragOver={(event) => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}>
              {file ? <><strong>{file.name}</strong><span>{formatSize(file.size)}{file.data ? "" : " · reading…"} · choose another or drop it here</span></> : <><strong>Choose a file</strong><span>or drop it here. It stays on this device.</span></>}
              <input ref={fileInput} className="wb-sr" type="file" onChange={(event) => void pick(event.target.files?.[0])} />
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
          <output className="wb-digest" htmlFor={source === "text" ? "hash-input" : undefined} data-empty={digest ? undefined : "true"}>{digest || hashError || (subject || file ? "Calculating…" : emptyText)}</output>
          <CopyBlocked show={blocked} what="the hash" />
          <p className="wb-pane-meta">{FORMAT_NOTE[format](BITS[algorithm])}{source === "text" && input === "" && digest ? " · hash of empty text (0 bytes)" : ""}</p>
        </section>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>
      <UndoToast state={undo} />

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

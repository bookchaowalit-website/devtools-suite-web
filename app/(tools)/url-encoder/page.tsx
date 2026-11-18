"use client";

import { useMemo, useState } from "react";
import { AlertIcon, CheckIcon, CopyBlocked, CopyIcon, Segmented, SwapIcon, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { convert, inspectQuery, type Mode } from "@/lib/url-encoder/codec";

type Direction = "encode" | "decode";
type Scope = "component" | "uri";
const DIRECTIONS = [{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }] as const;
const SCOPES = [{ value: "component", label: "Query value" }, { value: "uri", label: "Full URL" }] as const;
const SCOPE_HINT: Record<Scope, string> = {
  component: "encodeURIComponent: escapes everything, including / ? & =. Use it for one value inside a URL.",
  uri: "encodeURI: keeps the URL structure (/ ? & = #) and escapes the rest. Use it for a whole address.",
};

export default function UrlEncoderTool() {
  const [input, setInput] = useState("hello world?q=café & more");
  const [direction, setDirection] = useState<Direction>("encode");
  const [scope, setScope] = useState<Scope>("component");
  const [plusAsSpace, setPlusAsSpace] = useState(false);
  // null follows the input (shown when it has a "?"); true or false once you press Show or Hide.
  const [showQuery, setShowQuery] = useState<boolean | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const mode = `${scope}-${direction}` as Mode;
  // Live result: the codec is cheap, so it runs on every keystroke.
  const result = convert(mode, input, plusAsSpace);
  const output = result.ok ? result.value : "";
  const error = result.ok ? "" : result.error;
  const { copied, blocked, copy } = useCopy(output, (ok) => setAnnouncement(ok ? "Result copied to the clipboard." : "Copy was blocked. Select the result and copy it by hand."));
  const inputLabel = direction === "encode" ? "Text" : "Encoded";
  const outputLabel = direction === "encode" ? "Encoded" : "Text";

  const swap = () => {
    if (!output) return;
    setInput(output);
    setDirection(direction === "encode" ? "decode" : "encode");
    setAnnouncement(`Swapped. Now ${direction === "encode" ? "decoding" : "encoding"}.`);
  };
  const edit = (value: string) => setInput(value);
  const queryVisible = (showQuery ?? input.includes("?")) && Boolean(input.trim());
  // Live: the table follows the input while it is shown.
  const query = useMemo(() => (queryVisible ? inspectQuery(input) : null), [queryVisible, input]);

  return (
    <Workbench>
      <ToolIntro title="URL Encoder" summary="Percent-encode text so it is safe inside a URL, or decode it back to readable text." />

      <div className="wb-controls">
        <div className="wb-control-group">
          <Segmented label="Direction" options={DIRECTIONS} value={direction} onChange={setDirection} />
          <Segmented label="What you are encoding" options={SCOPES} value={scope} onChange={setScope} />
        </div>
        {/* Always rendered (disabled while encoding) so switching direction never moves the panes. */}
        <label className="wb-switch">
          <input type="checkbox" role="switch" checked={direction === "decode" && plusAsSpace} disabled={direction !== "decode"} onChange={(event) => setPlusAsSpace(event.target.checked)} />
          <span>Treat + as space<small>{direction === "decode" ? "For HTML form data" : "Decoding only"}</small></span>
        </label>
      </div>
      <p className="wb-hint wb-hint-top">{SCOPE_HINT[scope]}</p>

      <div className="wb-panes">
        <section className="wb-pane" data-invalid={error ? "true" : undefined}>
          <div className="wb-pane-head">
            <label htmlFor="url-input">{inputLabel}</label>
            <button type="button" className="wb-button-plain" onClick={() => edit("")} disabled={!input}>Clear</button>
          </div>
          <textarea
            id="url-input"
            value={input}
            onChange={(event) => edit(event.target.value)}
            placeholder={direction === "encode" ? "Type or paste text or a URL" : "Paste encoded text, e.g. caf%C3%A9"}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "url-error" : undefined}
            spellCheck={false}
            autoComplete="off"
          />
          {error ? <p id="url-error" className="wb-error" role="alert"><AlertIcon />{error}</p> : null}
        </section>

        <section className="wb-pane">
          <div className="wb-pane-head">
            <label htmlFor="url-output">{outputLabel}</label>
            <div className="wb-pane-tools">
              <button type="button" className="wb-button-plain" onClick={swap} disabled={!output} aria-label="Swap: use the result as input">
                <SwapIcon />Swap
              </button>
              <button type="button" className="wb-button" onClick={() => copy(output)} disabled={!output}>
                {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
              </button>
            </div>
          </div>
          <textarea id="url-output" value={output} readOnly placeholder={error ? "Fix the input to see the result" : "The result appears here as you type"} spellCheck={false} />
          <CopyBlocked show={blocked} />
        </section>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <div className="wb-actions">
        <button type="button" className="wb-button-plain" onClick={() => setShowQuery(!queryVisible)} disabled={!input.trim()} aria-expanded={queryVisible}>
          {queryVisible ? "Hide query parameters" : "Show query parameters"}
        </button>
      </div>
      {query ? (
        query.ok ? (
          <div className="wb-table-wrap">
            <table className="wb-table">
              <caption>{query.rows.length} query {query.rows.length === 1 ? "parameter" : "parameters"}, decoded (+ read as space)</caption>
              <thead><tr><th scope="col">Key</th><th scope="col">Value</th></tr></thead>
              <tbody>
                {query.rows.map((row, index) => (
                  <tr key={index}><th scope="row">{row.key || <em>(empty)</em>}</th><td>{row.value || <em>(empty)</em>}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="wb-error wb-error-inline" role="alert"><AlertIcon />{query.error}</p>
        )
      ) : null}
    </Workbench>
  );
}

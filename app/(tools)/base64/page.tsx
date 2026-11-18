"use client";

import { useState } from "react";
import { AlertIcon, CheckIcon, CopyBlocked, CopyIcon, Segmented, SwapIcon, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { Base64Error, decodeBase64, encodeBase64, plural, textStats } from "@/lib/base64/base64";

type Mode = "encode" | "decode";
const MODES = [{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }] as const;

function convert(mode: Mode, input: string, urlSafe: boolean): { output: string; error: string } {
  try {
    return { output: mode === "encode" ? encodeBase64(input, { urlSafe }) : decodeBase64(input), error: "" };
  } catch (caught) {
    return { output: "", error: caught instanceof Base64Error ? caught.message : "This text could not be converted." };
  }
}

const describe = (text: string) => {
  const stats = textStats(text);
  return `${plural(stats.characters, "character")} · ${plural(stats.bytes, "byte")}`;
};

export default function Base64Tool() {
  const [input, setInput] = useState("Hello, portfolio!");
  const [mode, setMode] = useState<Mode>("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  // The result follows the input as you type; there is no separate convert step.
  const { output, error } = convert(mode, input, urlSafe);
  const { copied, blocked, copy } = useCopy(output, (ok) => setAnnouncement(ok ? "Result copied to the clipboard." : "Copy was blocked. Select the result and copy it by hand."));
  const inputLabel = mode === "encode" ? "Text" : "Base64";
  const outputLabel = mode === "encode" ? "Base64" : "Text";

  const swap = () => {
    if (!output) return;
    setInput(output);
    setMode(mode === "encode" ? "decode" : "encode");
    setAnnouncement(`Swapped. Now ${mode === "encode" ? "decoding" : "encoding"}.`);
  };
  const clear = () => { setInput(""); setAnnouncement("Cleared."); };

  return (
    <Workbench>
      <ToolIntro title="Base64" summary="Encode text to Base64 or decode it back. UTF-8 safe, so Thai, emoji and accents survive the round trip." />

      <div className="wb-controls">
        <Segmented label="Direction" options={MODES} value={mode} onChange={setMode} />
        {/* Always rendered (disabled while decoding) so switching direction never moves the panes. */}
        <label className="wb-switch">
          <input type="checkbox" role="switch" checked={mode === "encode" && urlSafe} disabled={mode !== "encode"} onChange={(event) => setUrlSafe(event.target.checked)} />
          <span>URL-safe<small>{mode === "encode" ? "Uses - and _, drops = padding" : "Encoding only; decoding accepts both"}</small></span>
        </label>
      </div>

      <div className="wb-panes">
        <section className="wb-pane" data-invalid={error ? "true" : undefined}>
          <div className="wb-pane-head">
            <label htmlFor="b64-input">{inputLabel}</label>
            <button type="button" className="wb-button-plain" onClick={clear} disabled={!input}>Clear</button>
          </div>
          <textarea
            id="b64-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={mode === "encode" ? "Type or paste text" : "Paste Base64, standard or URL-safe"}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "b64-error" : "b64-input-meta"}
            spellCheck={false}
            autoComplete="off"
          />
          {error ? (
            <p id="b64-error" className="wb-error" role="alert"><AlertIcon />{error}</p>
          ) : (
            <p id="b64-input-meta" className="wb-pane-meta">{describe(input)}</p>
          )}
        </section>

        <section className="wb-pane">
          <div className="wb-pane-head">
            <label htmlFor="b64-output">{outputLabel}</label>
            <div className="wb-pane-tools">
              <button type="button" className="wb-button-plain" onClick={swap} disabled={!output} aria-label="Swap: use the result as input">
                <SwapIcon />Swap
              </button>
              <button type="button" className="wb-button" onClick={() => copy(output)} disabled={!output}>
                {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
              </button>
            </div>
          </div>
          <textarea id="b64-output" value={output} readOnly placeholder={error ? "Fix the input to see the result" : "The result appears here as you type"} aria-describedby="b64-output-meta" spellCheck={false} />
          <CopyBlocked show={blocked} />
          <p id="b64-output-meta" className="wb-pane-meta">{describe(output)}</p>
        </section>
      </div>

      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <p className="wb-hint">Decoding accepts standard or URL-safe Base64 and ignores spaces and line breaks.</p>
    </Workbench>
  );
}

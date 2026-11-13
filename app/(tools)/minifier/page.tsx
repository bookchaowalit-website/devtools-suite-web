"use client";

import { useState } from "react";
import { AlertIcon, CheckIcon, CopyIcon, Segmented, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { MODES, SAMPLES, minify, type Mode } from "@/lib/minifier/minify";

const LABEL: Record<Mode, string> = { json: "JSON", css: "CSS", html: "HTML", js: "JavaScript" };
const OPTIONS = MODES.map((value) => ({ value, label: value === "js" ? "JS" : LABEL[value] }));
const bytes = (text: string) => new TextEncoder().encode(text).length;

function run(mode: Mode, input: string): { output: string; error: string } {
  if (!input.trim()) return { output: "", error: "" };
  try {
    return { output: minify(mode, input), error: "" };
  } catch (cause) {
    return { output: "", error: cause instanceof Error ? cause.message : "This input could not be minified." };
  }
}

export default function MinifierTool() {
  const [mode, setMode] = useState<Mode>("json");
  const [input, setInput] = useState(SAMPLES.json);
  const [announcement, setAnnouncement] = useState("");
  const { output, error } = run(mode, input);
  const { copied, copy } = useCopy(output, (ok) => setAnnouncement(ok ? "Minified code copied to the clipboard." : "Copy was blocked. Select the result and copy it by hand."));

  // Switching language swaps in that language's sample only if you have not typed your own code.
  const chooseMode = (next: Mode) => {
    if (!input.trim() || input === SAMPLES[mode]) setInput(SAMPLES[next]);
    setMode(next);
  };
  const before = bytes(input);
  const after = bytes(output);
  const saved = before && output ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;

  return (
    <Workbench>
      <ToolIntro title="Code Minifier" summary="Strip comments and whitespace from small JSON, CSS, HTML or JavaScript snippets." />

      <div className="wb-controls">
        <Segmented label="Language" options={OPTIONS} value={mode} onChange={chooseMode} />
      </div>

      <div className="wb-panes">
        <section className="wb-pane" data-invalid={error ? "true" : undefined}>
          <div className="wb-pane-head">
            <label htmlFor="min-input">{LABEL[mode]}</label>
            <button type="button" className="wb-button-plain" onClick={() => setInput("")} disabled={!input}>Clear</button>
          </div>
          <textarea id="min-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Paste ${LABEL[mode]}`} aria-invalid={error ? true : undefined} aria-describedby={error ? "min-error" : "min-input-meta"} spellCheck={false} autoComplete="off" />
          {error ? (
            <p id="min-error" className="wb-error" role="alert"><AlertIcon />{error}</p>
          ) : (
            <p id="min-input-meta" className="wb-pane-meta">{before.toLocaleString("en")} bytes</p>
          )}
        </section>

        <section className="wb-pane">
          <div className="wb-pane-head">
            <label htmlFor="min-output">Minified</label>
            <button type="button" className="wb-button" onClick={() => copy(output)} disabled={!output}>
              {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
            </button>
          </div>
          <textarea id="min-output" value={output} readOnly placeholder="The minified code appears here as you type" aria-describedby="min-output-meta" spellCheck={false} />
          <p id="min-output-meta" className="wb-pane-meta wb-stats">
            <span>{after.toLocaleString("en")} bytes</span>
            {output ? <span><strong>{saved}% smaller</strong></span> : null}
          </p>
        </section>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <p className="wb-hint">A simple whitespace and comment stripper for snippets and demos, not a production compiler. JavaScript strings that contain // may be cut.</p>
    </Workbench>
  );
}

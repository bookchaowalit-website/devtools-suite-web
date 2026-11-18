"use client";

import { useState } from "react";
import { AlertIcon, CheckIcon, CopyBlocked, CopyIcon, Segmented, ToolIntro, UndoToast, useCopy, useUndo, Workbench } from "@/components/workbench";
import { MODES, SAMPLES, mayHaveRegexLiteral, minify, type Mode } from "@/lib/minifier/minify";

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
  // Set by Clear: switching language after clearing keeps the box empty instead of filling in a sample over it.
  const [cleared, setCleared] = useState(false);
  const undo = useUndo();
  const { output, error } = run(mode, input);
  const { copied, blocked, copy } = useCopy(output, (ok) => setAnnouncement(ok ? "Minified code copied to the clipboard." : "Copy was blocked. Select the result and copy it by hand."));

  // Switching language swaps in that language's sample only if you have not typed your own code.
  const chooseMode = (next: Mode) => {
    if ((!input.trim() && !cleared) || input === SAMPLES[mode]) setInput(SAMPLES[next]);
    setMode(next);
  };
  const clear = () => {
    const before = input;
    setInput(""); setCleared(true);
    undo.offer("Code cleared.", () => { setInput(before); setCleared(false); });
  };
  const regexWarning = mode === "js" && Boolean(output) && mayHaveRegexLiteral(input);
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
            <button type="button" className="wb-button-plain" onClick={clear} disabled={!input}>Clear</button>
          </div>
          <textarea id="min-input" value={input} onChange={(event) => { setInput(event.target.value); setCleared(false); }} placeholder={`Paste ${LABEL[mode]}`} aria-invalid={error ? true : undefined} aria-describedby={error ? "min-error" : "min-input-meta"} spellCheck={false} autoComplete="off" />
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
          <CopyBlocked show={blocked} />
          {regexWarning ? <p className="wb-note wb-note-alert wb-pane-note"><AlertIcon />This code may contain a regular expression literal (/…/). Spaces and // inside it are not protected: check the result.</p> : null}
          <p id="min-output-meta" className="wb-pane-meta wb-stats">
            <span>{after.toLocaleString("en")} bytes</span>
            {output ? <span><strong>{saved}% smaller</strong></span> : null}
          </p>
        </section>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>
      <UndoToast state={undo} />

      <p className="wb-hint">A simple whitespace and comment stripper for snippets and demos, not a production compiler. Strings and template literals are kept exactly; regular expression literals are not parsed, and line breaks are removed, so code that relies on automatic semicolons may break.</p>
    </Workbench>
  );
}

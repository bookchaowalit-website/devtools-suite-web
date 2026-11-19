"use client";

import { useEffect, useState } from "react";
import { AlertIcon, CheckIcon, CopyBlocked, CopyIcon, Segmented, ToolIntro, UndoToast, useCopy, useUndo, Workbench } from "@/components/workbench";
import { isInstant, MODES, SAMPLES, minify, minifyInstant, type Mode } from "@/lib/minifier/minify";

const LABEL: Record<Mode, string> = { json: "JSON", css: "CSS", html: "HTML", js: "JavaScript" };
const OPTIONS = MODES.map((value) => ({ value, label: value === "js" ? "JS" : LABEL[value] }));
const bytes = (text: string) => new TextEncoder().encode(text).length;

type Result = { output: string; error: string };
const failure = (cause: unknown): Result => ({ output: "", error: cause instanceof Error ? cause.message : "This input could not be minified." });

/** JSON, CSS and HTML minify during render (also on the server); JavaScript goes through terser in an effect. */
function runInstant(mode: Mode, input: string): Result | null {
  if (!input.trim()) return { output: "", error: "" };
  if (!isInstant(mode)) return null;
  try { return { output: minifyInstant(mode as "json" | "css" | "html", input), error: "" }; } catch (cause) { return failure(cause); }
}

export default function MinifierTool() {
  const [mode, setMode] = useState<Mode>("json");
  const [input, setInput] = useState(SAMPLES.json);
  const [announcement, setAnnouncement] = useState("");
  // Set by Clear: switching language after clearing keeps the box empty instead of filling in a sample over it.
  const [cleared, setCleared] = useState(false);
  const undo = useUndo();
  const instant = runInstant(mode, input);
  // A library result is kept with the mode and input it belongs to, so a slower, older run never shows.
  const [library, setLibrary] = useState<{ key: string; result: Result } | null>(null);
  const key = `${mode}\u0000${input}`;
  useEffect(() => {
    if (instant) return;
    let cancelled = false;
    minify(mode, input).then((output) => ({ output, error: "" }), failure).then((result) => { if (!cancelled) setLibrary({ key: `${mode}\u0000${input}`, result }); });
    return () => { cancelled = true; };
  }, [instant, mode, input]);
  const pending = !instant && library?.key !== key;
  const { output, error } = instant ?? (library?.key === key ? library.result : { output: "", error: "" });
  const { copied, blocked, copy } = useCopy(output, (ok) => setAnnouncement(ok ? "Minified code copied to the clipboard." : "Copy was blocked. Select the result and copy it by hand."));

  // Switching language swaps in that language's sample only if you have not typed your own code.
  const chooseMode = (next: Mode) => {
    if ((!input.trim() && !cleared) || input === SAMPLES[mode]) { setInput(SAMPLES[next]); undo.dismiss(); }
    setMode(next);
  };
  const clear = () => {
    const before = input;
    setInput(""); setCleared(true);
    undo.offer("Code cleared.", () => { setInput(before); setCleared(false); });
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
            <button type="button" className="wb-button-plain" onClick={clear} disabled={!input}>Clear</button>
          </div>
          <textarea id="min-input" value={input} onChange={(event) => { setInput(event.target.value); setCleared(false); undo.dismiss(); }} placeholder={`Paste ${LABEL[mode]}`} aria-invalid={error ? true : undefined} aria-describedby={error ? "min-error" : "min-input-meta"} spellCheck={false} autoComplete="off" />
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
          <textarea id="min-output" value={output} readOnly placeholder={pending ? "Minifying…" : error ? "Fix the input to see the result" : "The minified code appears here as you type"} aria-describedby="min-output-meta" spellCheck={false} />
          <CopyBlocked show={blocked} />
          {mode === "css" ? <p className="wb-note wb-pane-note">Removes comments and extra whitespace; values are never rewritten.</p> : null}
          <p id="min-output-meta" className="wb-pane-meta wb-stats">
            <span>{after.toLocaleString("en")} bytes</span>
            {output ? <span><strong>{saved}% smaller</strong></span> : null}
          </p>
        </section>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>
      <UndoToast state={undo} />

      <p className="wb-hint">JavaScript goes through terser, the minifier real build tools use, with renaming and compression off so the result still reads like your code. CSS and HTML only lose comments and extra whitespace.</p>
    </Workbench>
  );
}

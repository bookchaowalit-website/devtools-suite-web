"use client";

import { useRef, useState } from "react";
import { AlertIcon, CheckIcon, CopyBlocked, CopyIcon, Segmented, SwapIcon, ToolIntro, UndoToast, useCopy, useUndo, Workbench } from "@/components/workbench";
import { describeProblem, transformDocument, type ConversionMode, type Indent, type ParseProblem } from "@/lib/jsonconverter/conversion";

const MODES = [
  { value: "PRETTY", label: "Format" },
  { value: "MINIFY", label: "Minify" },
  { value: "JSON → YAML", label: "To YAML" },
  { value: "YAML → JSON", label: "To JSON" },
] as const satisfies readonly { value: ConversionMode; label: string }[];
const INDENTS = [{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }, { value: "tab", label: "Tab" }] as const;
const SOURCE: Record<ConversionMode, string> = { PRETTY: "JSON", MINIFY: "JSON", "JSON → YAML": "JSON", "YAML → JSON": "YAML" };
const RESULT: Record<ConversionMode, string> = { PRETTY: "Formatted JSON", MINIFY: "Minified JSON", "JSON → YAML": "YAML", "YAML → JSON": "JSON" };
/** Swap uses the result as the next input: a conversion flips direction, Format and Minify keep their mode. */
const SWAPPED: Record<ConversionMode, ConversionMode> = { PRETTY: "PRETTY", MINIFY: "PRETTY", "JSON → YAML": "YAML → JSON", "YAML → JSON": "JSON → YAML" };

function run(mode: ConversionMode, input: string, indent: Indent): { output: string; problem: ParseProblem | null } {
  if (!input.trim()) return { output: "", problem: null };
  try {
    return { output: transformDocument(input, mode, indent), problem: null };
  } catch (cause) {
    return { output: "", problem: describeProblem(input, cause) };
  }
}

export default function JsonConverterTool() {
  const [input, setInput] = useState('{\n  "project": "book-dev",\n  "active": true,\n  "tools": ["json", "yaml"]\n}');
  const [mode, setMode] = useState<ConversionMode>("PRETTY");
  const [indent, setIndent] = useState<Indent>("2");
  const [announcement, setAnnouncement] = useState("");
  const editor = useRef<HTMLTextAreaElement>(null);
  const undo = useUndo();
  // Live result: parsing a pasted document is fast enough to run on every keystroke.
  const { output, problem } = run(mode, input, indent);
  const { copied, blocked, copy } = useCopy(output, (ok) => setAnnouncement(ok ? "Result copied to the clipboard." : "Copy was blocked. Select the result and copy it by hand."));

  const clear = () => { const before = input; setInput(""); undo.offer("Document cleared.", () => setInput(before)); };
  const swap = () => {
    if (!output) return;
    setInput(output);
    setMode(SWAPPED[mode]);
    setAnnouncement(`Swapped. The result is now the input (${SOURCE[SWAPPED[mode]]}).`);
  };
  const goToProblem = () => {
    const area = editor.current;
    if (!area || problem?.offset === null || problem?.offset === undefined) return;
    area.focus();
    area.setSelectionRange(problem.offset, Math.min(input.length, problem.offset + 1));
    // Scroll the line into view: roughly line height × line number.
    const lineHeight = parseFloat(getComputedStyle(area).lineHeight) || 24;
    area.scrollTop = Math.max(0, ((problem.line ?? 1) - 3) * lineHeight);
  };

  return (
    <Workbench>
      <ToolIntro title="JSON Converter" summary="Format or minify JSON, and convert simple documents between JSON and YAML." />

      <div className="wb-controls">
        <Segmented label="Conversion" options={MODES} value={mode} onChange={setMode} />
        {/* Indent applies to formatted JSON (Format, To JSON); To YAML uses 2 or 4 spaces. */}
        <Segmented label="Indent" options={INDENTS} value={indent} onChange={setIndent} disabled={mode === "MINIFY"} />
      </div>

      <div className="wb-panes">
        <section className="wb-pane" data-invalid={problem ? "true" : undefined}>
          <div className="wb-pane-head">
            <label htmlFor="json-input">{SOURCE[mode]}</label>
            <button type="button" className="wb-button-plain" onClick={clear} disabled={!input}>Clear</button>
          </div>
          <textarea ref={editor} id="json-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Paste ${SOURCE[mode]}`} aria-invalid={problem ? true : undefined} aria-describedby={problem ? "json-error" : "json-input-meta"} spellCheck={false} autoComplete="off" />
          {problem ? (
            <div id="json-error" className="wb-error" role="alert">
              <AlertIcon />
              <span>{problem.message}{problem.line !== null ? <> <button type="button" className="wb-link" onClick={goToProblem}>Go to line {problem.line}</button></> : null}</span>
            </div>
          ) : (
            <p id="json-input-meta" className="wb-pane-meta">{input.length.toLocaleString("en")} characters</p>
          )}
        </section>

        <section className="wb-pane">
          <div className="wb-pane-head">
            <label htmlFor="json-output">{RESULT[mode]}</label>
            <div className="wb-pane-tools">
              <button type="button" className="wb-button-plain" onClick={swap} disabled={!output} aria-label="Swap: use the result as input">
                <SwapIcon />Swap
              </button>
              <button type="button" className="wb-button" onClick={() => copy(output)} disabled={!output}>
                {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
              </button>
            </div>
          </div>
          <textarea id="json-output" value={output} readOnly placeholder={problem ? "Fix the input to see the result" : "The result appears here as you type"} aria-describedby="json-output-meta" spellCheck={false} />
          <CopyBlocked show={blocked} />
          <p id="json-output-meta" className="wb-pane-meta">{output.length.toLocaleString("en")} characters</p>
        </section>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>
      <UndoToast state={undo} />

      <p className="wb-hint">YAML support covers everyday objects, arrays, strings, numbers and booleans (JSON schema). Swap turns JSON → YAML into YAML → JSON for a round trip.</p>
    </Workbench>
  );
}

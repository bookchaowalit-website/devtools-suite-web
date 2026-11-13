"use client";

import { useState } from "react";
import { AlertIcon, CheckIcon, CopyIcon, Segmented, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { transformDocument, type ConversionMode } from "@/lib/jsonconverter/conversion";

const MODES = [
  { value: "PRETTY", label: "Format" },
  { value: "MINIFY", label: "Minify" },
  { value: "JSON → YAML", label: "To YAML" },
  { value: "YAML → JSON", label: "To JSON" },
] as const satisfies readonly { value: ConversionMode; label: string }[];
const SOURCE: Record<ConversionMode, string> = { PRETTY: "JSON", MINIFY: "JSON", "JSON → YAML": "JSON", "YAML → JSON": "YAML" };
const RESULT: Record<ConversionMode, string> = { PRETTY: "Formatted JSON", MINIFY: "Minified JSON", "JSON → YAML": "YAML", "YAML → JSON": "JSON" };

function run(mode: ConversionMode, input: string): { output: string; error: string } {
  if (!input.trim()) return { output: "", error: "" };
  try {
    return { output: transformDocument(input, mode), error: "" };
  } catch (cause) {
    return { output: "", error: cause instanceof Error ? cause.message : "Could not convert this document." };
  }
}

export default function JsonConverterTool() {
  const [input, setInput] = useState('{\n  "project": "book-dev",\n  "active": true,\n  "tools": ["json", "yaml"]\n}');
  const [mode, setMode] = useState<ConversionMode>("PRETTY");
  const [announcement, setAnnouncement] = useState("");
  // Live result: parsing a pasted document is fast enough to run on every keystroke.
  const { output, error } = run(mode, input);
  const { copied, copy } = useCopy(output, (ok) => setAnnouncement(ok ? "Result copied to the clipboard." : "Copy was blocked. Select the result and copy it by hand."));

  return (
    <Workbench>
      <ToolIntro title="JSON Converter" summary="Format or minify JSON, and convert simple documents between JSON and YAML." />

      <div className="wb-controls">
        <Segmented label="Conversion" options={MODES} value={mode} onChange={setMode} />
      </div>

      <div className="wb-panes">
        <section className="wb-pane" data-invalid={error ? "true" : undefined}>
          <div className="wb-pane-head">
            <label htmlFor="json-input">{SOURCE[mode]}</label>
            <button type="button" className="wb-button-plain" onClick={() => setInput("")} disabled={!input}>Clear</button>
          </div>
          <textarea id="json-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Paste ${SOURCE[mode]}`} aria-invalid={error ? true : undefined} aria-describedby={error ? "json-error" : "json-input-meta"} spellCheck={false} autoComplete="off" />
          {error ? (
            <p id="json-error" className="wb-error" role="alert"><AlertIcon />{error}</p>
          ) : (
            <p id="json-input-meta" className="wb-pane-meta">{input.length.toLocaleString("en")} characters</p>
          )}
        </section>

        <section className="wb-pane">
          <div className="wb-pane-head">
            <label htmlFor="json-output">{RESULT[mode]}</label>
            <button type="button" className="wb-button" onClick={() => copy(output)} disabled={!output}>
              {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
            </button>
          </div>
          <textarea id="json-output" value={output} readOnly placeholder="The result appears here as you type" aria-describedby="json-output-meta" spellCheck={false} />
          <p id="json-output-meta" className="wb-pane-meta">{output.length.toLocaleString("en")} characters</p>
        </section>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <p className="wb-hint">YAML support covers everyday objects, arrays, strings, numbers and booleans (JSON schema).</p>
    </Workbench>
  );
}
